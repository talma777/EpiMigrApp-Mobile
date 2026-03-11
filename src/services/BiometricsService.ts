/**
 * EpiMigrApp — BiometricsService (Frontend)
 * ==========================================
 * Central service for biometric operations and risk polling.
 */

import { api } from './api';
import { wearableService, WearableStatus } from './WearableService';
import * as Location from 'expo-location';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskFactor {
    signal: string;
    value: number;
    unit: string;
    contribution: number;
    label: string;
}

export interface RiskAnalysis {
    clinicalIndex: number;      // CI (0-100)
    protectionIndex: number;    // IPC (0-100%)
    lambdaProbability: number;  // λ (0.0 - 1.0)
    riskLevel: RiskLevel;
    confidence: number;
    factors: RiskFactor[];
    explanation: string;
    recommendedActions: string[];
    analyzedAt: string;
    xaiInsight: string;         // Explainable AI Pattern
}

type RiskCallback = (analysis: RiskAnalysis) => void;
type StatusCallback = (status: WearableStatus) => void;

class BiometricsService {
    private riskPollId: any = null;
    private onRiskUpdate: RiskCallback | null = null;
    private onStatusChange: StatusCallback | null = null;
    private lastAnalysis: RiskAnalysis | null = null;
    private currentLocation: { lat: number, lon: number } | null = null;

    // ── Public ────────────────────────────────────────────────────────────

    async startMonitoring(
        userId: string,
        onRisk?: RiskCallback,
        onStatus?: StatusCallback,
    ): Promise<void> {
        if (onRisk) this.onRiskUpdate = onRisk;
        if (onStatus) this.onStatusChange = onStatus;

        // Iniciar stream de wearable (Forzando Hardware Físico)
        await wearableService.startMonitoring(userId, true);
        this.onStatusChange?.(wearableService.getStatus());

        // Solicitar permisos y obtener ubicación inicial
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                this.currentLocation = { lat: location.coords.latitude, lon: location.coords.longitude };
            }
        } catch (e) {
            console.warn('[BiometricsService] Could not get location:', e);
        }

        // Polling de riesgo acelerado (cada 5 segundos) para respuesta táctil inmediata
        await this.pollRisk(userId);
        this.riskPollId = setInterval(() => this.pollRisk(userId), 5000);

        console.log(`[BiometricsService] Monitoring active for ${userId} (High frequency + Location)`);
    }

    stopMonitoring(): void {
        wearableService.stopMonitoring();
        if (this.riskPollId) {
            clearInterval(this.riskPollId);
            this.riskPollId = null;
        }
    }

    async getRiskAnalysis(userId: string): Promise<RiskAnalysis | null> {
        try {
            const data = await api.get(`/biometrics/risk/${userId}`);
            this.lastAnalysis = data as RiskAnalysis;
            return this.lastAnalysis;
        } catch (err) {
            return this.lastAnalysis;
        }
    }

    getCachedAnalysis(): RiskAnalysis | null {
        return this.lastAnalysis;
    }

    /**
     * CONVERGENCIA TRACK A
     * Registra un episodio en la nueva estructura persistente.
     */
    async logEpisode(userId: string, intensity: number, triggers: string[], notes: string, medTaken: boolean): Promise<void> {
        await api.post('/episodes', {
            userId,
            timestamp: new Date().toISOString(),
            intensity,
            triggers,
            notes,
            medicationTaken: medTaken
        });
        // Recalcular riesgo inmediatamente
        await this.pollRisk(userId);
    }

    /**
     * Dispara un SOS médico.
     */
    async triggerSOS(userId: string): Promise<void> {
        // Actualizar ubicación antes del SOS si es posible
        try {
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            this.currentLocation = { lat: location.coords.latitude, lon: location.coords.longitude };
        } catch (e) { /* ignore */ }

        await api.post('/biometrics/ingest', {
            userId,
            dataType: 'SOS_TRIGGER',
            value: 1,
            unit: 'event',
            timestamp: new Date().toISOString(),
            metadata: this.currentLocation ? { location: this.currentLocation } : undefined
        });
        await this.pollRisk(userId);
    }

    // ── Private ───────────────────────────────────────────────────────────

    private async pollRisk(userId: string): Promise<void> {
        try {
            // Construir URL con coordenadas si están disponibles
            let url = `/biometrics/risk/${userId}`;
            if (this.currentLocation) {
                url += `?lat=${this.currentLocation.lat}&lon=${this.currentLocation.lon}`;
            }

            const analysis = await api.get(url) as RiskAnalysis;
            this.lastAnalysis = analysis;
            this.onRiskUpdate?.(analysis);
        } catch (err) {
            if (this.lastAnalysis) {
                this.onRiskUpdate?.(this.lastAnalysis);
            }
        }
    }
}

export const biometrics = new BiometricsService();
