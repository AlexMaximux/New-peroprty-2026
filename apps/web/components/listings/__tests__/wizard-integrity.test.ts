import { describe, it, expect } from 'vitest';
import {
  ALL_WIZARD_PATHS,
  PATH_SECTIONS,
  getSectionIds,
  pathKey,
  type SectionId,
} from '../wizard/types';
import { WIZARD_REGISTERED_SECTIONS } from '../wizard/rent-to-rent-wizard';

describe('wizard path → section mapping integrity', () => {
  it('every WizardPath produces a non-empty section list', () => {
    for (const wp of ALL_WIZARD_PATHS) {
      const key = pathKey(wp);
      const sections = getSectionIds(wp);
      expect(sections, `PATH_SECTIONS["${key}"] should have entries`).toBeDefined();
      expect(sections.length, `PATH_SECTIONS["${key}"] should not be empty`).toBeGreaterThan(0);
    }
  });

  it('every WizardPath key matches a known PATH_SECTIONS entry', () => {
    const keys = ALL_WIZARD_PATHS.map(pathKey);
    const expected = [
      'RENT_TO_RENT_HMO', 'RENT_TO_RENT_SA', 'RENT_TO_RENT_BLOCK_OF_PROPERTY',
      'SELL_PROPERTY_SINGLE_LET', 'SELL_PROPERTY_HMO', 'SELL_PROPERTY_HIGH_ROI',
      'SELL_PROPERTY_CASH_PURCHASE', 'SELL_PROPERTY_FLAT_CONVERSION',
      'SELL_PROPERTY_ADD_BEDROOM', 'SELL_PROPERTY_EXTENSION', 'SELL_PROPERTY_LOFT_CONVERSION',
    ];
    for (const k of keys) {
      expect(expected, `key "${k}" not in expected set`).toContain(k);
      expect(PATH_SECTIONS, `PATH_SECTIONS missing key "${k}"`).toHaveProperty(k);
    }
  });

  it('every SectionId across all paths has a registered component', () => {
    const registered = new Set<SectionId>(WIZARD_REGISTERED_SECTIONS);
    const seen = new Set<SectionId>();

    for (const wp of ALL_WIZARD_PATHS) {
      const sections = getSectionIds(wp);
      for (const sec of sections) {
        seen.add(sec);
        expect(
          registered.has(sec),
          `SectionId "${sec}" (used in ${pathKey(wp)}) has no registered component. Add to WIZARD_REGISTERED_SECTIONS and implement render case.`,
        ).toBe(true);
      }
    }

    // sanity — at least one section was checked
    expect(seen.size).toBeGreaterThan(0);
  });

  it('no unused registered sections (every registered section appears in at least one path)', () => {
    const allPathSections = new Set<SectionId>();
    for (const wp of ALL_WIZARD_PATHS) {
      for (const sec of getSectionIds(wp)) {
        allPathSections.add(sec);
      }
    }
    for (const sec of WIZARD_REGISTERED_SECTIONS) {
      expect(
        allPathSections.has(sec),
        `SectionId "${sec}" is registered but not used in any PATH_SECTIONS entry. Either add it to a path or remove from WIZARD_REGISTERED_SECTIONS.`,
      ).toBe(true);
    }
  });
});
