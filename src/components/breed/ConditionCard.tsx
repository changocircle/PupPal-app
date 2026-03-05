/**
 * Health condition card for breed detail page
 * Shows condition name, prevalence badge, description, and symptoms
 */

import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Typography } from '../ui';
import type { BreedCondition } from '../../types/breed';
import { PREVALENCE_COLORS } from '../../types/breed';
import { COLORS, RADIUS } from '../../constants/theme';

interface ConditionCardProps {
  condition: BreedCondition;
}

export function ConditionCard({ condition }: ConditionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const colors = PREVALENCE_COLORS[condition.prevalence] || PREVALENCE_COLORS.moderate;

  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      style={{
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="body" style={{ fontWeight: '600', flex: 1 }}>
          {condition.condition}
        </Typography>
        <View
          style={{
            backgroundColor: colors.bg,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 12,
          }}
        >
          <Typography
            variant="caption"
            style={{ color: colors.text, fontWeight: '600', fontSize: 11 }}
          >
            {condition.prevalence.toUpperCase()}
          </Typography>
        </View>
      </View>

      {expanded && (
        <View style={{ marginTop: 8 }}>
          <Typography variant="caption" color="secondary" style={{ marginBottom: 6 }}>
            {condition.description}
          </Typography>
          {condition.symptoms.length > 0 && (
            <View>
              <Typography
                variant="caption"
                style={{ fontWeight: '600', marginBottom: 4 }}
              >
                Watch for:
              </Typography>
              {condition.symptoms.map((symptom, i) => (
                <Typography
                  key={i}
                  variant="caption"
                  color="secondary"
                  style={{ marginLeft: 8 }}
                >
                  • {symptom}
                </Typography>
              ))}
            </View>
          )}
        </View>
      )}

      {!expanded && (
        <Typography
          variant="caption"
          color="tertiary"
          style={{ marginTop: 4, fontSize: 11 }}
        >
          Tap for details
        </Typography>
      )}
    </Pressable>
  );
}
