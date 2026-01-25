#!/usr/bin/env python3
"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ElderNest AI - Activity Pattern Analyzer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyzes activity patterns from historical data:
- Eating patterns (meal times, skipped meals)
- Sleep quality (duration, interruptions)
- Camera activity (movement detection)
- Daily routines (consistency vs irregularity)

This component identifies subtle changes in behavior
that may indicate declining health or wellbeing.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from loguru import logger


class ActivityAnalyzer:
    """
    Activity pattern analyzer for elderly care monitoring.
    
    Capabilities:
    - Analyze eating patterns and detect meal skipping
    - Assess sleep quality and irregularities
    - Monitor camera activity for prolonged inactivity
    - Detect changes in daily routines
    """
    
    # Expected meal times (24-hour format)
    MEAL_TIMES = {
        'breakfast': (6, 10),    # 6am - 10am
        'lunch': (11, 15),       # 11am - 3pm
        'dinner': (17, 21)       # 5pm - 9pm
    }
    
    # Ideal sleep hours
    IDEAL_SLEEP_MIN = 7
    IDEAL_SLEEP_MAX = 9
    
    # Thresholds
    CONCERNING_MISSED_MEALS = 3  # In 7 days
    CONCERNING_INACTIVITY_HOURS = 12
    CONCERNING_SLEEP_INTERRUPTIONS = 4
    
    def __init__(self):
        """Initialize ActivityAnalyzer."""
        logger.info("✅ ActivityAnalyzer initialized")
    
    def analyze_eating_pattern(
        self, 
        meal_logs: List[Dict],
        days: int = 7
    ) -> Dict:
        """
        Analyze eating patterns from meal logs.
        
        Args:
            meal_logs: List of meal records:
                [
                    {'timestamp': '2026-01-22T08:30:00', 'meal_type': 'breakfast'},
                    {'timestamp': '2026-01-22T13:00:00', 'meal_type': 'lunch'},
                    ...
                ]
            days: Number of days to analyze
            
        Returns:
            Eating pattern analysis:
            {
                'meals_per_day_avg': 2.5,
                'missed_meals_total': 3,
                'eating_irregularity': 0.4,  # 0=regular, 1=very irregular
                'days_without_eating': 0,
                'meal_breakdown': {
                    'breakfast': {'count': 6, 'missed': 1, 'avg_time': '08:15'},
                    'lunch': {'count': 5, 'missed': 2, 'avg_time': '12:30'},
                    'dinner': {'count': 7, 'missed': 0, 'avg_time': '19:00'}
                },
                'concerning': False,
                'concerns': []
            }
        """
        # Handle empty logs
        if not meal_logs:
            return {
                'meals_per_day_avg': 0.0,
                'missed_meals_total': days * 3,  # 3 meals per day expected
                'eating_irregularity': 1.0,
                'days_without_eating': days,
                'meal_breakdown': {},
                'concerning': True,
                'concerns': ['No meal data available']
            }
        
        try:
            # Convert to DataFrame
            df = pd.DataFrame(meal_logs)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df['date'] = df['timestamp'].dt.date
            df['hour'] = df['timestamp'].dt.hour
            
            # Calculate meals per day
            meals_per_day = df.groupby('date').size()
            avg_meals = meals_per_day.mean()
            
            # Expected meals
            expected_days = min(days, len(meals_per_day))
            expected_meals = expected_days * 3
            actual_meals = len(df)
            missed_meals = max(0, expected_meals - actual_meals)
            
            # Eating irregularity (time variance)
            time_variance = df.groupby('meal_type')['hour'].std().mean()
            eating_irregularity = min(time_variance / 4.0, 1.0) if not pd.isna(time_variance) else 0.5
            
            # Days without any meals
            all_dates = pd.date_range(
                end=datetime.now(),
                periods=days
            ).date
            dates_with_meals = set(df['date'].unique())
            days_without_eating = len([d for d in all_dates if d not in dates_with_meals])
            
            # Meal breakdown
            meal_breakdown = {}
            for meal_type in ['breakfast', 'lunch', 'dinner']:
                meal_df = df[df['meal_type'] == meal_type]
                if len(meal_df) > 0:
                    avg_hour = int(meal_df['hour'].mean())
                    avg_min = int((meal_df['hour'].mean() % 1) * 60)
                    avg_time = f"{avg_hour:02d}:{avg_min:02d}"
                else:
                    avg_time = 'N/A'
                
                meal_breakdown[meal_type] = {
                    'count': len(meal_df),
                    'missed': max(0, expected_days - len(meal_df)),
                    'avg_time': avg_time
                }
            
            # Identify concerns
            concerns = []
            if avg_meals < 2.0:
                concerns.append(f'Low meal frequency: {avg_meals:.1f} meals/day')
            if days_without_eating > 1:
                concerns.append(f'No meals for {days_without_eating} days')
            if missed_meals > self.CONCERNING_MISSED_MEALS:
                concerns.append(f'{missed_meals} missed meals in {days} days')
            if eating_irregularity > 0.5:
                concerns.append('Irregular meal times detected')
            
            concerning = len(concerns) > 0 or days_without_eating > 1
            
            return {
                'meals_per_day_avg': round(avg_meals, 2),
                'missed_meals_total': int(missed_meals),
                'eating_irregularity': round(eating_irregularity, 3),
                'days_without_eating': int(days_without_eating),
                'meal_breakdown': meal_breakdown,
                'concerning': concerning,
                'concerns': concerns
            }
            
        except Exception as e:
            logger.error(f"Eating pattern analysis error: {e}")
            return {
                'meals_per_day_avg': 0.0,
                'missed_meals_total': 0,
                'eating_irregularity': 0.5,
                'days_without_eating': 0,
                'meal_breakdown': {},
                'concerning': False,
                'concerns': [],
                'error': str(e)
            }
    
    def analyze_sleep_pattern(
        self, 
        sleep_logs: List[Dict],
        days: int = 7
    ) -> Dict:
        """
        Analyze sleep quality from logs.
        
        Args:
            sleep_logs: List of sleep records:
                [
                    {
                        'date': '2026-01-22',
                        'sleep_hours': 7.5,
                        'interruptions': 2,
                        'quality_rating': 3  # optional, 1-5
                    },
                    ...
                ]
            days: Number of days to analyze
            
        Returns:
            Sleep pattern analysis:
            {
                'avg_sleep_hours': 6.5,
                'sleep_quality_score': 0.7,  # 0-1
                'avg_interruptions': 2.3,
                'irregular_sleep': False,
                'sleep_deficit': -1.5,  # hours below ideal
                'concerning': False,
                'concerns': []
            }
        """
        # Handle empty logs
        if not sleep_logs:
            return {
                'avg_sleep_hours': 0.0,
                'sleep_quality_score': 0.0,
                'avg_interruptions': 0.0,
                'irregular_sleep': True,
                'sleep_deficit': -self.IDEAL_SLEEP_MIN,
                'concerning': True,
                'concerns': ['No sleep data available']
            }
        
        try:
            df = pd.DataFrame(sleep_logs)
            
            # Basic statistics
            avg_sleep = df['sleep_hours'].mean()
            sleep_std = df['sleep_hours'].std()
            avg_interruptions = df.get('interruptions', pd.Series([0])).mean()
            
            # Calculate quality score (0-1)
            # Based on ideal sleep hours and interruptions
            
            # Hours score: penalty for too little or too much sleep
            if avg_sleep < self.IDEAL_SLEEP_MIN:
                hours_score = max(0, avg_sleep / self.IDEAL_SLEEP_MIN)
            elif avg_sleep > self.IDEAL_SLEEP_MAX:
                hours_score = max(0, 1 - (avg_sleep - self.IDEAL_SLEEP_MAX) / 4)
            else:
                hours_score = 1.0
            
            # Interruption score: penalty for frequent wake-ups
            interruption_score = max(0, 1.0 - avg_interruptions / 6)
            
            # Combined quality score
            quality_score = (hours_score * 0.6 + interruption_score * 0.4)
            
            # Irregular sleep: high variance in sleep hours
            irregular_sleep = sleep_std > 2.0 if not pd.isna(sleep_std) else False
            
            # Sleep deficit
            sleep_deficit = avg_sleep - self.IDEAL_SLEEP_MIN
            
            # Identify concerns
            concerns = []
            if avg_sleep < 5:
                concerns.append(f'Severe sleep deficit: only {avg_sleep:.1f} hours/night')
            elif avg_sleep < 6:
                concerns.append(f'Insufficient sleep: {avg_sleep:.1f} hours/night')
            if avg_sleep > 10:
                concerns.append(f'Excessive sleep: {avg_sleep:.1f} hours/night')
            if avg_interruptions > self.CONCERNING_SLEEP_INTERRUPTIONS:
                concerns.append(f'Frequent sleep interruptions: {avg_interruptions:.1f}/night')
            if irregular_sleep:
                concerns.append('Irregular sleep schedule detected')
            
            concerning = (
                avg_sleep < 5 or 
                avg_sleep > 11 or 
                avg_interruptions > self.CONCERNING_SLEEP_INTERRUPTIONS or
                quality_score < 0.4
            )
            
            return {
                'avg_sleep_hours': round(avg_sleep, 2),
                'sleep_quality_score': round(max(0, quality_score), 3),
                'avg_interruptions': round(avg_interruptions, 1),
                'irregular_sleep': irregular_sleep,
                'sleep_deficit': round(sleep_deficit, 2),
                'concerning': concerning,
                'concerns': concerns
            }
            
        except Exception as e:
            logger.error(f"Sleep pattern analysis error: {e}")
            return {
                'avg_sleep_hours': 0.0,
                'sleep_quality_score': 0.0,
                'avg_interruptions': 0.0,
                'irregular_sleep': False,
                'sleep_deficit': 0.0,
                'concerning': False,
                'concerns': [],
                'error': str(e)
            }
    
    def analyze_camera_activity(
        self, 
        activity_logs: List[Dict],
        window_hours: int = 24
    ) -> Dict:
        """
        Analyze activity from camera motion detection logs.
        
        Args:
            activity_logs: List of activity detection events:
                [
                    {'timestamp': '2026-01-22T10:00:00', 'activity_detected': True},
                    {'timestamp': '2026-01-22T10:30:00', 'activity_detected': False},
                    ...
                ]
            window_hours: Analysis window in hours
            
        Returns:
            Camera activity analysis:
            {
                'max_inactivity_hours': 12.5,
                'total_active_hours': 8.0,
                'activity_percentage': 33.3,
                'prolonged_inactivity': True,
                'inactivity_periods': [
                    {'start': '...', 'end': '...', 'duration_hours': 12.5}
                ],
                'concerning': True,
                'concerns': []
            }
        """
        # Handle empty logs
        if not activity_logs:
            return {
                'max_inactivity_hours': float(window_hours),
                'total_active_hours': 0.0,
                'activity_percentage': 0.0,
                'prolonged_inactivity': True,
                'inactivity_periods': [],
                'concerning': True,
                'concerns': ['No activity data available']
            }
        
        try:
            df = pd.DataFrame(activity_logs)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.sort_values('timestamp')
            
            # Find inactivity periods
            inactivity_periods = []
            current_inactive_start = None
            max_inactivity = 0.0
            
            for idx, row in df.iterrows():
                if not row['activity_detected']:
                    if current_inactive_start is None:
                        current_inactive_start = row['timestamp']
                else:
                    if current_inactive_start is not None:
                        duration = (row['timestamp'] - current_inactive_start).total_seconds() / 3600
                        
                        if duration > 1:  # Only track periods > 1 hour
                            inactivity_periods.append({
                                'start': current_inactive_start.isoformat(),
                                'end': row['timestamp'].isoformat(),
                                'duration_hours': round(duration, 2)
                            })
                        
                        max_inactivity = max(max_inactivity, duration)
                        current_inactive_start = None
            
            # Handle ongoing inactivity
            if current_inactive_start is not None:
                duration = (datetime.now() - current_inactive_start.to_pydatetime().replace(tzinfo=None)).total_seconds() / 3600
                if duration > 1:
                    inactivity_periods.append({
                        'start': current_inactive_start.isoformat(),
                        'end': 'ongoing',
                        'duration_hours': round(duration, 2)
                    })
                max_inactivity = max(max_inactivity, duration)
            
            # Calculate active hours
            active_events = df[df['activity_detected'] == True]
            if len(active_events) > 1:
                # Estimate active time based on event density
                time_span = (df['timestamp'].max() - df['timestamp'].min()).total_seconds() / 3600
                active_hours = (len(active_events) / len(df)) * time_span
            else:
                active_hours = 0.0
            
            activity_percentage = (active_hours / window_hours) * 100 if window_hours > 0 else 0.0
            
            # Determine if concerning
            prolonged_inactivity = max_inactivity > self.CONCERNING_INACTIVITY_HOURS
            
            concerns = []
            if prolonged_inactivity:
                concerns.append(f'No movement for {max_inactivity:.1f} hours')
            if activity_percentage < 20:
                concerns.append(f'Very low activity level: {activity_percentage:.1f}%')
            
            concerning = prolonged_inactivity or activity_percentage < 15
            
            return {
                'max_inactivity_hours': round(max_inactivity, 2),
                'total_active_hours': round(active_hours, 2),
                'activity_percentage': round(activity_percentage, 1),
                'prolonged_inactivity': prolonged_inactivity,
                'inactivity_periods': inactivity_periods[-5:],  # Last 5 periods
                'concerning': concerning,
                'concerns': concerns
            }
            
        except Exception as e:
            logger.error(f"Camera activity analysis error: {e}")
            return {
                'max_inactivity_hours': 0.0,
                'total_active_hours': 0.0,
                'activity_percentage': 0.0,
                'prolonged_inactivity': False,
                'inactivity_periods': [],
                'concerning': False,
                'concerns': [],
                'error': str(e)
            }
    
    def analyze_daily_routine(
        self,
        all_activity_logs: List[Dict],
        days: int = 7
    ) -> Dict:
        """
        Analyze overall daily routine consistency.
        
        Args:
            all_activity_logs: Combined activity data (meals, sleep, movement)
            days: Number of days to analyze
            
        Returns:
            Routine analysis:
            {
                'routine_score': 0.75,  # 0=chaotic, 1=very consistent
                'consistency_rating': 'moderate',
                'typical_wake_time': '07:30',
                'typical_sleep_time': '22:30',
                'activity_trend': 'stable' | 'declining' | 'improving',
                'concerning': False,
                'recommendations': []
            }
        """
        if not all_activity_logs:
            return {
                'routine_score': 0.0,
                'consistency_rating': 'unknown',
                'typical_wake_time': 'N/A',
                'typical_sleep_time': 'N/A',
                'activity_trend': 'unknown',
                'concerning': True,
                'recommendations': ['Increase monitoring to establish baseline']
            }
        
        try:
            df = pd.DataFrame(all_activity_logs)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df['date'] = df['timestamp'].dt.date
            df['hour'] = df['timestamp'].dt.hour
            
            # Calculate routine consistency based on activity timing variance
            daily_patterns = df.groupby(['date', 'hour']).size().reset_index(name='events')
            
            if len(daily_patterns) > 0:
                hour_consistency = 1.0 - (daily_patterns['hour'].std() / 12)
                routine_score = max(0, min(1, hour_consistency))
            else:
                routine_score = 0.0
            
            # Consistency rating
            if routine_score > 0.8:
                consistency_rating = 'excellent'
            elif routine_score > 0.6:
                consistency_rating = 'good'
            elif routine_score > 0.4:
                consistency_rating = 'moderate'
            elif routine_score > 0.2:
                consistency_rating = 'poor'
            else:
                consistency_rating = 'chaotic'
            
            # Estimate typical wake/sleep times (simplified)
            morning_activity = df[df['hour'].between(5, 10)]
            evening_activity = df[df['hour'].between(20, 24)]
            
            typical_wake = f"{int(morning_activity['hour'].mean()):02d}:00" if len(morning_activity) > 0 else 'N/A'
            typical_sleep = f"{int(evening_activity['hour'].mean()):02d}:00" if len(evening_activity) > 0 else 'N/A'
            
            # Activity trend (compare first half vs second half of period)
            mid_date = df['date'].median()
            first_half = df[df['date'] <= mid_date]
            second_half = df[df['date'] > mid_date]
            
            if len(first_half) > 0 and len(second_half) > 0:
                trend_ratio = len(second_half) / len(first_half)
                if trend_ratio > 1.2:
                    activity_trend = 'improving'
                elif trend_ratio < 0.8:
                    activity_trend = 'declining'
                else:
                    activity_trend = 'stable'
            else:
                activity_trend = 'insufficient_data'
            
            # Generate recommendations
            recommendations = []
            if routine_score < 0.4:
                recommendations.append('Encourage establishing consistent daily routines')
            if activity_trend == 'declining':
                recommendations.append('Activity levels declining - consider scheduling activities')
            if consistency_rating in ['poor', 'chaotic']:
                recommendations.append('Monitor for signs of confusion or disorientation')
            
            concerning = routine_score < 0.3 or activity_trend == 'declining'
            
            return {
                'routine_score': round(routine_score, 3),
                'consistency_rating': consistency_rating,
                'typical_wake_time': typical_wake,
                'typical_sleep_time': typical_sleep,
                'activity_trend': activity_trend,
                'concerning': concerning,
                'recommendations': recommendations
            }
            
        except Exception as e:
            logger.error(f"Daily routine analysis error: {e}")
            return {
                'routine_score': 0.0,
                'consistency_rating': 'error',
                'typical_wake_time': 'N/A',
                'typical_sleep_time': 'N/A',
                'activity_trend': 'unknown',
                'concerning': False,
                'recommendations': [],
                'error': str(e)
            }
    
    def get_comprehensive_activity_summary(
        self,
        meal_logs: List[Dict],
        sleep_logs: List[Dict],
        camera_logs: List[Dict],
        days: int = 7
    ) -> Dict:
        """
        Generate comprehensive activity summary combining all data sources.
        
        Args:
            meal_logs: Meal record logs
            sleep_logs: Sleep record logs
            camera_logs: Camera activity logs
            days: Analysis window in days
            
        Returns:
            Comprehensive summary with all analyses and overall assessment
        """
        # Run all analyses
        eating = self.analyze_eating_pattern(meal_logs, days)
        sleep = self.analyze_sleep_pattern(sleep_logs, days)
        camera = self.analyze_camera_activity(camera_logs, days * 24)
        
        # Combine all activity logs for routine analysis
        all_logs = []
        for log in meal_logs or []:
            all_logs.append({
                'timestamp': log.get('timestamp'),
                'type': 'meal'
            })
        for log in camera_logs or []:
            if log.get('activity_detected'):
                all_logs.append({
                    'timestamp': log.get('timestamp'),
                    'type': 'movement'
                })
        
        routine = self.analyze_daily_routine(all_logs, days)
        
        # Overall concern level
        concern_count = sum([
            eating.get('concerning', False),
            sleep.get('concerning', False),
            camera.get('concerning', False),
            routine.get('concerning', False)
        ])
        
        if concern_count >= 3:
            overall_status = 'critical'
            overall_message = 'Multiple concerning patterns detected'
        elif concern_count >= 2:
            overall_status = 'warning'
            overall_message = 'Some concerning patterns detected'
        elif concern_count == 1:
            overall_status = 'caution'
            overall_message = 'Minor concerns detected'
        else:
            overall_status = 'healthy'
            overall_message = 'Activity patterns appear normal'
        
        # Collect all concerns
        all_concerns = (
            eating.get('concerns', []) +
            sleep.get('concerns', []) +
            camera.get('concerns', [])
        )
        
        return {
            'eating_pattern': eating,
            'sleep_pattern': sleep,
            'camera_activity': camera,
            'daily_routine': routine,
            'overall_status': overall_status,
            'overall_message': overall_message,
            'concern_count': concern_count,
            'all_concerns': all_concerns,
            'analysis_period_days': days,
            'timestamp': datetime.now().isoformat()
        }


# Create global instance for import
activity_analyzer = ActivityAnalyzer()
