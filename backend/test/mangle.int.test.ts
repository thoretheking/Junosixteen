import { query } from '../src/grpc/mangleClient';

describe('Mangle integration', () => {
  it('allows Q1 when prerequisites met', async () => {
    const res = await query('can_attempt("u1","L1",1).');
    expect(Array.isArray(res)).toBe(true);
  });
  
  it('computes points', async () => {
    const res = await query('points_for("u1","L1",P).');
    // at least returns a fact string
    expect(res[0]).toMatch(/points_for/);
  });
}); 