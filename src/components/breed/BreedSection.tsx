/**
 * Collapsible section for the breed detail page
 * Provides consistent section styling with optional expand/collapse
 */

import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Typography } from '../ui';
import { COLORS, RADIUS } from '../../constants/theme';

interface BreedSectionProps {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export function BreedSection({
  title,
  children,
  collapsible = false,
  defaultExpanded = true,
  actionLabel,
  onAction,
}: BreedSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View
      style={{
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <Pressable
        onPress={collapsible ? () => setExpanded(!expanded) : undefined}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: expanded ? 12 : 0,
        }}
      >
        <Typography
          variant="h3"
          style={{
            fontSize: 14,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: COLORS.text.secondary,
          }}
        >
          {title}
        </Typography>
        {collapsible && (
          <Typography variant="body" color="tertiary">
            {expanded ? '▲' : '▼'}
          </Typography>
        )}
      </Pressable>

      {expanded && (
        <>
          {children}
          {actionLabel && onAction && (
            <Pressable
              onPress={onAction}
              style={{ marginTop: 12, alignItems: 'center' }}
            >
              <Typography
                variant="body"
                style={{ color: COLORS.primary.DEFAULT, fontWeight: '600' }}
              >
                {actionLabel}
              </Typography>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}
