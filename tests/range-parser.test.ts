import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parsePageRanges } from '../src/lib/pdf/range-parser';

describe('PDF Range Parser', () => {
  it('parses single page numbers', () => {
    const res = parsePageRanges('3', 10);
    assert.equal(res.valid, true);
    assert.equal(res.groups.length, 1);
    assert.deepEqual(res.groups[0].pageIndices, [2]);
    assert.equal(res.groups[0].label, 'page-3');
  });

  it('parses continuous ranges like 1-5', () => {
    const res = parsePageRanges('1-5', 10);
    assert.equal(res.valid, true);
    assert.equal(res.groups.length, 1);
    assert.deepEqual(res.groups[0].pageIndices, [0, 1, 2, 3, 4]);
    assert.equal(res.groups[0].label, 'pages-1-5');
  });

  it('parses comma-separated pages like 1, 3, 5', () => {
    const res = parsePageRanges('1, 3, 5', 10);
    assert.equal(res.valid, true);
    assert.equal(res.groups.length, 3);
    assert.deepEqual(res.groups[0].pageIndices, [0]);
    assert.deepEqual(res.groups[1].pageIndices, [2]);
    assert.deepEqual(res.groups[2].pageIndices, [4]);
  });

  it('parses complex mixed ranges like 1-5, 8, 11-14 with whitespace', () => {
    const res = parsePageRanges('  1-5 ,  8, 11-14  ', 20);
    assert.equal(res.valid, true);
    assert.equal(res.groups.length, 3);
    assert.deepEqual(res.groups[0].pageIndices, [0, 1, 2, 3, 4]);
    assert.deepEqual(res.groups[1].pageIndices, [7]);
    assert.deepEqual(res.groups[2].pageIndices, [10, 11, 12, 13]);
    assert.deepEqual(res.allPageIndices, [0, 1, 2, 3, 4, 7, 10, 11, 12, 13]);
  });

  it('rejects page 0 and negative numbers', () => {
    const resZero = parsePageRanges('0', 10);
    assert.equal(resZero.valid, false);

    const resNeg = parsePageRanges('-1', 10);
    assert.equal(resNeg.valid, false);
  });

  it('rejects inverted ranges like 5-2', () => {
    const res = parsePageRanges('5-2', 10);
    assert.equal(res.valid, false);
    assert.match(res.error || '', /Inverted range/i);
  });

  it('rejects non-numeric input like "abc"', () => {
    const res = parsePageRanges('abc', 10);
    assert.equal(res.valid, false);
  });

  it('rejects trailing or consecutive commas', () => {
    assert.equal(parsePageRanges('1,,3', 10).valid, false);
    assert.equal(parsePageRanges('1,2,', 10).valid, false);
    assert.equal(parsePageRanges(',1,2', 10).valid, false);
  });

  it('rejects out-of-bounds page requests', () => {
    const res = parsePageRanges('1-11', 10);
    assert.equal(res.valid, false);
    assert.match(res.error || '', /Page 11 does not exist/);
  });

  it('rejects pathological input exceeding length limits', () => {
    const hugeInput = '1-2,'.repeat(1000); // > 4000 characters
    const res = parsePageRanges(hugeInput, 10);
    assert.equal(res.valid, false);
    assert.match(res.error || '', /exceeds maximum allowed length/i);
  });

  it('rejects malformed dashes such as 1--5, 1-2-3, 1-, and -5', () => {
    assert.equal(parsePageRanges('1--5', 10).valid, false);
    assert.equal(parsePageRanges('1-2-3', 10).valid, false);
    assert.equal(parsePageRanges('1-', 10).valid, false);
    assert.equal(parsePageRanges('-5', 10).valid, false);
  });

  it('rejects floats, NaN, and scientific notation', () => {
    assert.equal(parsePageRanges('1.5-3', 10).valid, false);
    assert.equal(parsePageRanges('NaN', 10).valid, false);
    assert.equal(parsePageRanges('1e5', 10).valid, false);
  });

  it('handles empty input gracefully', () => {
    assert.equal(parsePageRanges('', 10).valid, false);
    assert.equal(parsePageRanges('   ', 10).valid, false);
  });
});
