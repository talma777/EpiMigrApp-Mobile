/**
 * EpiMigrApp — Wearable Abstraction Layer
 * =========================================
 * Strategy pattern: one interface, multiple adapters.
 */

import { Platform } from 'react-native';
import AppleHealthKit, { HealthValue, HealthInputOptions } from 'react-native-health';
import { api } from './api';

// ── Types ──────────────────────────────────────────────────────────────────
export type SignalType = 'heart_rate' | 'eda' | 'hrv' | 'accelerometer' | 'SOS_TRIGGER';

export interface BiometricReading {
    dataType: SignalType;
    value: number;
    unit: string;
    timestamp: string;
    source: WearableSource;
    confidence?: number;   // 0-1, data quality
    metadata?: Record<string, any>;
}

export type WearableSource =
    | 'mock_simulation'
    | 'expo_sensors'
    | 'expo_health_apple'
    | 'expo_health_google'
    | 'empatica_embrace'
    | 'manual_entry';

export interface WearableStatus {
    connected: boolean;
    source: WearableSource;
    batteryLevel?: number;
    lastReading?: string;
    signalsAvailable: SignalType[];
}

// ── Interface all adapters must implement ──────────────────────────────────
export interface IWearableAdapter {
    readonly source: WearableSource;
    connect(): Promise<void>;
    disconnect(): void;
    startStream(callback: (reading: BiometricReading) => void): void;
    stopStream(): void;
    getStatus(): WearableStatus;
    getSupportedSignals(): SignalType[];
}

// ══ ADAPTER 1: Mock Simulation ════════════════════════════════════════════
class MockWearableAdapter implements IWearableAdapter {
    readonly source: WearableSource = 'mock_simulation';
    private intervalId: any = null;
    private baseHR = 72;
    private trend = 0;

    async connect(): Promise<void> {
        console.log('[MockAdapter] Connected — simulation mode');
    }

    disconnect(): void {
        this.stopStream();
        console.log('[MockAdapter] Disconnected');
    }

    startStream(callback: (reading: BiometricReading) => void): void {
        if (this.intervalId) return;
        const ts = () => new Date().toISOString();

        this.intervalId = setInterval(() => {
            this.trend += (Math.random() - 0.5) * 6;
            this.trend = Math.max(-15, Math.min(45, this.trend));
            const hr = Math.round(this.baseHR + this.trend + (Math.random() - 0.5) * 8);

            callback({ dataType: 'heart_rate', value: Math.max(50, Math.min(160, hr)), unit: 'bpm', timestamp: ts(), source: this.source, confidence: 0.95 });
            callback({ dataType: 'eda', value: parseFloat((Math.random() * 20 + 0.5).toFixed(3)), unit: 'μS', timestamp: ts(), source: this.source, confidence: 0.90 });
        }, 1500);
    }

    stopStream(): void {
        if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    }

    getStatus(): WearableStatus {
        return { connected: this.intervalId !== null, source: this.source, batteryLevel: 100, signalsAvailable: ['heart_rate', 'eda', 'accelerometer'] };
    }

    getSupportedSignals(): SignalType[] { return ['heart_rate', 'eda', 'accelerometer']; }
}

// ══ ADAPTER 2: Web Bluetooth API (HARDWARE REAL) ══════════════════════════
class WebBluetoothAdapter implements IWearableAdapter {
    readonly source: WearableSource = 'empatica_embrace';
    private device: any = null;
    private server: any = null;
    private hrCharacteristic: any = null;
    private intervalId: any = null;
    private connected = false;
    private currentHR = 0; // Se lee del reloj físico

    async connect(): Promise<void> {
        if (Platform.OS !== 'web' || !navigator || !(navigator as any).bluetooth) {
            throw new Error('Web Bluetooth API no soportado. Safari iOS no lo soporta. Trata desde Android Chrome o Windows.');
        }

        console.log('[WebBT] Pidiendo permisos de Bluetooth al dispositivo...');
        try {
            // Muchos relojes (como el EF16) no declaran su servicio HR en su paquete de anuncio BLE inicial.
            // Para que aparezcan en la lista de Chrome, usamos acceptAllDevices y luego solicitamos los servicios.
            this.device = await (navigator as any).bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['heart_rate', 'battery_service']
            });

            this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

            console.log(`[WebBT] Dispositivo aceptado: ${this.device.name}. Conectando GATT...`);
            this.server = await this.device.gatt.connect();

            console.log('[WebBT] GATT conectado. Buscando servicio médico estándar de pulso (0x180D)...');
            let service;
            try {
                service = await this.server.getPrimaryService('heart_rate');
            } catch (err) {
                this.device.gatt.disconnect();
                throw new Error(`El reloj ${this.device.name} fue aceptado, pero no expone un canal médico estándar compatible para extraer tu pulso.`);
            }

            this.hrCharacteristic = await service.getCharacteristic('heart_rate_measurement');

            await this.hrCharacteristic.startNotifications();
            this.hrCharacteristic.addEventListener('characteristicvaluechanged', this.handleHeartRateChanged.bind(this));

            this.connected = true;
            console.log('[WebBT] ¡Hardware biológico conectado exitosamente!');
        } catch (error) {
            console.error('[WebBT] Autenticación de hardware BT fallida:', error);
            throw error;
        }
    }

    private handleHeartRateChanged(event: any) {
        const value = event.target.value;
        const flags = value.getUint8(0);
        const rate16Bits = flags & 0x1;
        let heartRate;
        if (rate16Bits) {
            heartRate = value.getUint16(1, true);
        } else {
            heartRate = value.getUint8(1);
        }
        // Dato físico REAL ingresado desde la piel del paciente
        this.currentHR = heartRate;
    }

    private onDisconnected() {
        console.log('[WebBT] Sensor desconectado físicamente.');
        this.connected = false;
        this.stopStream();
    }

    disconnect(): void {
        this.stopStream();
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
        this.connected = false;
    }

    startStream(callback: (reading: BiometricReading) => void): void {
        if (this.intervalId) return;
        const ts = () => new Date().toISOString();

        this.intervalId = setInterval(() => {
            if (!this.connected) return;

            // Si se quita el reloj, el currentHR puede decaer o el sensor dejar de notificar.
            // Para asegurar la fidelidad de que si se lo quitó, se marque 0 o falle.
            if (this.currentHR === 0) {
                // Esperando lectura
                callback({ dataType: 'heart_rate', value: 0, unit: 'bpm', timestamp: ts(), source: this.source, confidence: 0 });
            } else {
                callback({
                    dataType: 'heart_rate',
                    value: this.currentHR,
                    unit: 'bpm',
                    timestamp: ts(),
                    source: this.source,
                    confidence: 0.99,
                });
            }
            // Agregamos un EDA simulado o fijo si el BT generico no provee conductancia
            callback({ dataType: 'eda', value: parseFloat((Math.random() * 2 + 1.5).toFixed(3)), unit: 'μS', timestamp: ts(), source: this.source, confidence: 0.5 });
        }, 1500);
    }

    stopStream(): void {
        if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    }

    getStatus(): WearableStatus {
        return { connected: this.connected, source: this.source, signalsAvailable: ['heart_rate', 'eda'] };
    }

    getSupportedSignals(): SignalType[] { return ['heart_rate', 'eda']; }
}

// ══ ADAPTER 3: Apple HealthKit (LIGE ZL02CPRO -> Da Fit -> Apple Health) ══
class AppleHealthAdapter implements IWearableAdapter {
    readonly source: WearableSource = 'expo_health_apple';
    private intervalId: any = null;
    private connected = false;

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (Platform.OS !== 'ios') {
                console.log('[AppleHealth] Saltando, solo disponible en iOS.');
                reject(new Error('Apple Health sólo está disponible en dispositivos iOS.'));
                return;
            }

            const permissions = {
                permissions: {
                    read: [AppleHealthKit.Constants.Permissions.HeartRate]
                },
            } as any;

            AppleHealthKit.initHealthKit(permissions, (err: string) => {
                if (err) {
                    console.error('[AppleHealth] Permiso denegado o error: ', err);
                    reject(new Error(err));
                    return;
                }
                console.log('[AppleHealth] Inicializado y enlazado correctamente.');
                this.connected = true;
                resolve();
            });
        });
    }

    private fetchHeartRate(callback: (reading: BiometricReading) => void) {
        if (Platform.OS !== 'ios') return;

        const options: HealthInputOptions = {
            unit: 'bpm',
            limit: 1,
            ascending: false,
        };

        AppleHealthKit.getHeartRateSamples(options, (err: Object, results: Array<HealthValue>) => {
            if (err) {
                console.log('[AppleHealth] Error leyendo sensor: ', err);
                return;
            }
            if (results && results.length > 0) {
                const hr = results[0].value;
                callback({
                    dataType: 'heart_rate',
                    value: hr,
                    unit: 'bpm',
                    timestamp: new Date().toISOString(),
                    source: this.source,
                    confidence: 0.99, // Alta confianza porque viene directo de Apple Health
                });
            }
        });
    }

    startStream(callback: (reading: BiometricReading) => void): void {
        if (!this.connected || this.intervalId) return;
        const ts = () => new Date().toISOString();

        // Lectura inicial
        this.fetchHeartRate(callback);

        // Ciclo de extracción para alimentar la IA
        this.intervalId = setInterval(() => {
            if (!this.connected) return;
            this.fetchHeartRate(callback);

            // Dato sintético de conductancia para completar la matriz del modelo 
            callback({ dataType: 'eda', value: parseFloat((Math.random() * 2 + 1.2).toFixed(3)), unit: 'μS', timestamp: ts(), source: this.source, confidence: 0.5 });
        }, 5000);
    }

    stopStream(): void {
        if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    }

    disconnect(): void {
        this.stopStream();
        this.connected = false;
    }

    getStatus(): WearableStatus {
        return { connected: this.connected, source: this.source, signalsAvailable: ['heart_rate'] };
    }

    getSupportedSignals(): SignalType[] { return ['heart_rate']; }
}

// ══ WEARABLE SERVICE ══════════════════════════════════════════════════════
class WearableService {
    private adapter: IWearableAdapter;
    private userId: string | null = null;

    private listeners: ((reading: BiometricReading) => void)[] = [];
    private connectedDeviceName: string | null = null;

    constructor() {
        this.adapter = new MockWearableAdapter(); // Inicializar con dummy
    }

    getConnectedDeviceName(): string | null {
        return this.connectedDeviceName;
    }

    subscribe(callback: (reading: BiometricReading) => void) {
        this.listeners.push(callback);
        return () => { this.listeners = this.listeners.filter(l => l !== callback); };
    }

    async startMonitoring(userId: string, forceHardware: boolean = false): Promise<void> {
        this.userId = userId;

        if (forceHardware) {
            // Intentar conectar hardware FÍSICO REAL via Bluetooth o HealthKit
            if (Platform.OS === 'ios') {
                try {
                    console.log('[WearableService] Intentando conectar con Apple HealthKit...');
                    this.adapter = new AppleHealthAdapter();
                    await this.adapter.connect();
                    this.connectedDeviceName = 'LIGE ZL02CPRO (Apple Health)';
                } catch (err) {
                    console.warn("Fallo Apple Health. Fallback a Simulación", err);
                    this.adapter = new MockWearableAdapter();
                    await this.adapter.connect();
                    this.connectedDeviceName = 'Simulación AI Activa (Fallback)';
                }
            } else {
                try {
                    this.adapter = new WebBluetoothAdapter();
                    await this.adapter.connect();
                    this.connectedDeviceName = 'Hardware Físico BT (BLE HR)';
                } catch (err) {
                    console.warn("Fallo Hardware. Fallback a SIM CLINICA", err);
                    this.adapter = new MockWearableAdapter();
                    await this.adapter.connect();
                    this.connectedDeviceName = 'Simulación AI Activa (Fallback)';
                }
            }
        } else {
            // Si ya tiene algo, no lo pisa (o usa mock)
            if (!this.adapter) {
                this.adapter = new MockWearableAdapter();
                await this.adapter.connect();
                this.connectedDeviceName = 'Empatica Embrace (Mode)';
            } else if (!this.connectedDeviceName) {
                await this.adapter.connect();
                this.connectedDeviceName = 'Monitoring Sensor';
            }
        }
        this.adapter.startStream(async (reading) => {
            // Notificar a componentes locales
            this.listeners.forEach(l => l(reading));
            // Subir a la nube
            await this.uploadReading(reading);
        });
        console.log(`[WearableService] Monitoring started for user ${userId} via ${this.adapter.source}`);
    }

    stopMonitoring(): void {
        this.adapter.stopStream();
        this.adapter.disconnect();
        console.log('[WearableService] Monitoring stopped');
    }

    getStatus(): WearableStatus {
        return this.adapter.getStatus();
    }

    getAdapterInfo() {
        return {
            source: this.adapter.source,
            signals: this.adapter.getSupportedSignals(),
            status: this.adapter.getStatus(),
        };
    }

    /**
     * CONVERGENCIA TRACK A / B
     * Se sincroniza el timestamp del dispositivo con el backend validado.
     */
    private async uploadReading(reading: BiometricReading): Promise<void> {
        if (!this.userId) return;
        try {
            await api.post('/biometrics/ingest', {
                userId: this.userId,
                dataType: reading.dataType,
                value: reading.value,
                unit: reading.unit,
                timestamp: reading.timestamp, // <--- Sincronización crucial
                metadata: {
                    source: reading.source,
                    confidence: reading.confidence,
                    ...reading.metadata,
                },
            });
        } catch (err) {
            console.warn('[WearableService] Connection sync failed', err);
        }
    }
}

export const wearableService = new WearableService();
