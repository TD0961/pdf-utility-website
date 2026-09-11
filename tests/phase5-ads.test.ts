import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isAdPlacementAllowed,
  isAnchorAllowed,
  getReservedMinHeight,
} from '../src/lib/ads/ad-strategy';

describe('Phase 5: AdSense Monetization & Ad Placement Policy', () => {
  describe('Editor Policy Enforcement (Strict Isolation)', () => {
    it('disallows any ads inside or adjacent to editor functional areas', () => {
      assert.equal(isAdPlacementAllowed('editor', 'post-tool'), false);
      assert.equal(isAdPlacementAllowed('editor', 'in-content'), false);
      assert.equal(isAdPlacementAllowed('editor', 'anchor'), false);
    });

    it('disallows anchor ads on editor', () => {
      assert.equal(isAnchorAllowed('editor'), false);
    });
  });

  describe('Legal Policy Enforcement', () => {
    it('disallows anchor ads on legal pages', () => {
      assert.equal(isAnchorAllowed('legal'), false);
    });

    it('disallows anchor and post-tool ads on legal pages', () => {
      assert.equal(isAdPlacementAllowed('legal', 'anchor'), false);
      assert.equal(isAdPlacementAllowed('legal', 'post-tool'), false);
    });
  });

  describe('Tool Page Policy Enforcement', () => {
    it('allows post-tool and end-content ads on standard tool pages', () => {
      assert.equal(isAdPlacementAllowed('tool', 'post-tool'), true);
      assert.equal(isAdPlacementAllowed('tool', 'end-content'), true);
    });

    it('allows anchor ad on tool pages', () => {
      assert.equal(isAnchorAllowed('tool'), true);
    });
  });

  describe('Guide and Resource Page Policy Enforcement', () => {
    it('allows end-content and multiplex ads on guide pages', () => {
      assert.equal(isAdPlacementAllowed('guide', 'end-content'), true);
      assert.equal(isAdPlacementAllowed('guide', 'multiplex'), true);
      assert.equal(isAnchorAllowed('guide'), true);
    });

    it('allows end-content ads on resource pages', () => {
      assert.equal(isAdPlacementAllowed('resource', 'end-content'), true);
      assert.equal(isAnchorAllowed('resource'), false);
    });
  });

  describe('Home Page Policy Enforcement', () => {
    it('allows in-content ads on the homepage', () => {
      assert.equal(isAdPlacementAllowed('home', 'in-content'), true);
      assert.equal(isAdPlacementAllowed('home', 'post-tool'), false);
    });
  });

  describe('CLS Prevention (Reserved Min-Heights)', () => {
    it('returns exact reserved min-heights for different ad formats', () => {
      assert.equal(getReservedMinHeight('horizontal'), 90);
      assert.equal(getReservedMinHeight('rectangle'), 250);
      assert.equal(getReservedMinHeight('multiplex'), 280);
      assert.equal(getReservedMinHeight('auto'), 100);
      assert.equal(getReservedMinHeight(undefined), 100);
    });
  });
});
