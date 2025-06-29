// components/WorkoutPlay/CountdownTimer.jsx

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors } from '../../constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const NUM_PARTICLES = 12;

const ParticleEffect = ({ startAnimation }) => {
    const particles = [...Array(NUM_PARTICLES)].map(() => ({
        animation: new Animated.Value(0),
        angle: Math.random() * Math.PI * 2
    }));

    useEffect(() => {
        if (startAnimation) {
            particles.forEach(particle => {
                Animated.sequence([
                    Animated.timing(particle.animation, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.out(Easing.cubic),
                        useNativeDriver: true
                    }),
                    Animated.timing(particle.animation, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true
                    })
                ]).start();
            });
        }
    }, [startAnimation]);

    return (
        <>
            {particles.map((particle, index) => {
                const translateX = particle.animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.cos(particle.angle) * 100]
                });
                const translateY = particle.animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.sin(particle.angle) * 100]
                });
                const scale = particle.animation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1, 0]
                });
                const rotate = particle.animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${Math.random() * 360}deg`]
                });

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.particle,
                            {
                                transform: [
                                    { translateX },
                                    { translateY },
                                    { scale },
                                    { rotate }
                                ]
                            }
                        ]}
                    >
                        <MaterialCommunityIcons
                            name={index % 2 === 0 ? "star" : "circle"}
                            size={12}
                            color={index % 3 === 0 ? Colors.light.primary : Colors.light.secondary}
                        />
                    </Animated.View>
                );
            })}
        </>
    );
};

export default function CountdownTimer({ duration, onComplete, isPaused }) {
    const [timeLeft, setTimeLeft] = useState(duration);
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const shakeAnimation = useRef(new Animated.Value(0)).current;
    const glowAnimation = useRef(new Animated.Value(0)).current;
    const circleAnimation = useRef(null);
    const intervalRef = useRef(null);
    const startTimeRef = useRef(Date.now());
    const pausedTimeRef = useRef(null);
    const [isCompleting, setIsCompleting] = useState(false);
    const [showParticles, setShowParticles] = useState(false);

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true
                })
            ])
        );

        if (!isPaused && timeLeft > 0) {
            pulse.start();
        } else {
            pulse.stop();
        }

        return () => pulse.stop();
    }, [isPaused, timeLeft]);

    const playCompletionAnimation = () => {
        setIsCompleting(true);
        setShowParticles(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Shake animation
        Animated.sequence([
            ...Array(4).fill().map(() => 
                Animated.sequence([
                    Animated.timing(shakeAnimation, {
                        toValue: 1,
                        duration: 100,
                        useNativeDriver: true
                    }),
                    Animated.timing(shakeAnimation, {
                        toValue: -1,
                        duration: 100,
                        useNativeDriver: true
                    }),
                    Animated.timing(shakeAnimation, {
                        toValue: 0,
                        duration: 100,
                        useNativeDriver: true
                    })
                ])
            )
        ]).start();

        // Glow animation
        Animated.sequence([
            Animated.timing(glowAnimation, {
                toValue: 1,
                duration: 500,
                useNativeDriver: false
            }),
            Animated.timing(glowAnimation, {
                toValue: 0,
                duration: 500,
                useNativeDriver: false
            })
        ]).start();

        // Final scale out
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.3,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.delay(1000),
            Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            })
        ]).start(() => {
            onComplete();
        });
    };

    useEffect(() => {
        if (!isPaused) {
            if (pausedTimeRef.current !== null) {
                startTimeRef.current = Date.now() - ((duration - timeLeft) * 1000);
            }

            circleAnimation.current = Animated.timing(rotateAnim, {
                toValue: 1,
                duration: timeLeft * 1000,
                easing: Easing.linear,
                useNativeDriver: true
            });
            circleAnimation.current.start();

            intervalRef.current = setInterval(() => {
                const elapsedTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
                const newTimeLeft = Math.max(0, duration - elapsedTime);
                
                setTimeLeft(newTimeLeft);
                
                if (newTimeLeft <= 0 && !isCompleting) {
                    clearInterval(intervalRef.current);
                    playCompletionAnimation();
                }
            }, 100);
        } else {
            pausedTimeRef.current = timeLeft;
            clearInterval(intervalRef.current);
            circleAnimation.current?.stop();
        }

        return () => {
            clearInterval(intervalRef.current);
            circleAnimation.current?.stop();
        };
    }, [isPaused]);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const shake = shakeAnimation.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-15deg', '0deg', '15deg']
    });

    const glow = glowAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 10]
    });

    const progressColor = timeLeft <= 5 ? Colors.light.primary : Colors.light.secondary;

    return (
        <View style={styles.containerOuter}>
            <Animated.View style={[
                styles.container,
                {
                    transform: [
                        { scale: scaleAnim },
                        { rotate: shake }
                    ]
                }
            ]}>
                <ParticleEffect startAnimation={showParticles} />
                <View style={styles.timerContainer}>
                    <Animated.View 
                        style={[
                            styles.circleWrapper, 
                            { transform: [{ rotate }] }
                        ]}
                    >
                        <Animated.View 
                            style={[
                                styles.progressCircle,
                                { backgroundColor: progressColor },
                                { transform: [{ scale: pulseAnim }] }
                            ]} 
                        />
                    </Animated.View>
                    <Animated.View 
                        style={[
                            styles.timeTextContainer,
                            {
                                shadowRadius: glow,
                                shadowColor: Colors.light.primary,
                                shadowOpacity: glowAnimation
                            }
                        ]}
                    >
                        <Text style={[
                            styles.timeText,
                            timeLeft <= 5 && styles.timeTextWarning
                        ]}>
                            {Math.ceil(timeLeft)}
                        </Text>
                        <Text style={styles.secondsText}>seconds</Text>
                    </Animated.View>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    containerOuter: {
        position: 'relative',
        paddingVertical: 20,
        alignItems: 'center'
    },
    container: {
        paddingVertical: 20,
        alignItems: 'center'
    },
    timerContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center'
    },
    circleWrapper: {
        width: '100%',
        height: '100%',
        position: 'absolute'
    },
    progressCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        position: 'absolute',
        top: 0,
        left: '50%',
        marginLeft: -10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5
    },
    timeTextContainer: {
        backgroundColor: Colors.light.background,
        borderRadius: 60,
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: Colors.light.lightGray,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5
    },
    timeText: {
        fontSize: 32,
        fontFamily: 'outfit-medium',
        color: Colors.light.text
    },
    timeTextWarning: {
        color: Colors.light.primary
    },
    secondsText: {
        fontSize: 12,
        fontFamily: 'outfit',
        color: Colors.light.secondary
    },
    particle: {
        position: 'absolute',
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center'
    }
});