import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({ width = '100%', height = 20, borderRadius = 8 }) => {
    return <View style={[styles.skeleton, { width: width as any, height: height as any, borderRadius }]} />;
};

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#E2E8F0',
        overflow: 'hidden',
    },
});
