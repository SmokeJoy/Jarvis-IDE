import { retryAsync } from './retry';
import { expect } from 'chai';
import { describe, it } from 'mocha';

describe('retryAsync', () => {
  it('should not retry if the function succeeds', async () => {
    let count = 0;
    const result = await retryAsync(() => {
      count++;
      return Promise.resolve('success');
    });
    expect(result).to.equal('success');
    expect(count).to.equal(1);
  });

  it('should retry on failure and succeed', async () => {
    let count = 0;
    const result = await retryAsync(
      () => {
        count++;
        if (count === 1) throw new Error('Temporary error');
        return Promise.resolve('success after retry');
      },
      2,
      10
    );
    expect(result).to.equal('success after retry');
    expect(count).to.equal(2);
  });

  it('should throw after max retries', async () => {
    let count = 0;
    try {
      await retryAsync(
        () => {
          count++;
          throw new Error('Persistent error');
        },
        2,
        10
      );
      throw new Error('Should not reach here');
    } catch (e: any) {
      expect(e.message).to.equal('Persistent error');
      expect(count).to.equal(3); // Initial attempt + 2 retries
    }
  });

  it('should respect retry delay', async () => {
    let count = 0;
    const startTime = Date.now();
    const result = await retryAsync(
      () => {
        count++;
        if (count === 1) throw new Error('Temporary error');
        return Promise.resolve('success after retry');
      },
      2,
      50
    );

    const duration = Date.now() - startTime;
    expect(duration).to.be.at.least(40); // Allow small variance
    expect(count).to.equal(2);
    expect(result).to.equal('success after retry');
  });
});
