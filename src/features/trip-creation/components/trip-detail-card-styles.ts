import { StyleSheet } from 'react-native';

import { spacing } from '@/theme/spacing';

/** Shared card shell used by weather, summary note, and similar detail blocks. */
export const tripDetailCardStyles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  body: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
});

/** Compact fact card metrics aligned with Trip Overview TripFact cards. */
export const tripFactCardStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconSlot: {
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
    paddingRight: spacing.xs,
  },
  label: {
    lineHeight: 16,
  },
  value: {
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 18,
  },
});
