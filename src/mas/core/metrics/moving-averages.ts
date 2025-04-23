/**
 * @file moving-averages.ts
 * @description Provides reusable classes for calculating Exponential Moving Average (EMA)
 *              and Simple Moving Average (SMA).
 * @version 1.0.0
 */

/**
 * Calculates the Exponential Moving Average (EMA).
 * EMA gives more weight to recent values, making it more responsive to changes.
 */
export class EMA {
  private alpha: number;
  private ema: number | null = null;

  /**
   * @param alpha Smoothing factor (0 < alpha <= 1). Smaller alpha means slower decay, more weight on historical data. Common values are 2 / (N + 1) where N is the number of periods.
   */
  constructor(alpha: number) {
    if (alpha <= 0 || alpha > 1) {
      throw new Error('Alpha must be between 0 (exclusive) and 1 (inclusive).');
    }
    this.alpha = alpha;
  }

  /**
   * Updates the EMA with a new value.
   * @param value The new data point.
   */
  update(value: number): void {
    if (this.ema === null) {
      this.ema = value;
    } else {
      this.ema = this.alpha * value + (1 - this.alpha) * this.ema;
    }
  }

  /**
   * Returns the current EMA value.
   * Returns null if no values have been added yet.
   */
  get(): number | null {
    return this.ema;
  }

  /**
   * Resets the EMA calculation.
   */
  reset(): void {
    this.ema = null;
  }
}

/**
 * Calculates the Simple Moving Average (SMA) over a fixed window size.
 * SMA gives equal weight to all values within the window.
 */
export class SMA {
  private windowSize: number;
  private values: number[] = [];
  private sum: number = 0;

  /**
   * @param windowSize The number of data points to include in the average.
   */
  constructor(windowSize: number) {
    if (windowSize <= 0) {
      throw new Error('Window size must be positive.');
    }
    this.windowSize = windowSize;
  }

  /**
   * Updates the SMA with a new value.
   * @param value The new data point.
   */
  update(value: number): void {
    this.values.push(value);
    this.sum += value;

    if (this.values.length > this.windowSize) {
      // Remove the oldest value if the window is full
      const oldestValue = this.values.shift();
      if (oldestValue !== undefined) {
        this.sum -= oldestValue;
      }
    }
  }

  /**
   * Returns the current SMA value.
   * Returns null if the window is not yet full.
   */
  get(): number | null {
    if (this.values.length === 0) {
      return null; // Or 0, depending on desired behavior for empty data
    }
    // Optionally, return null or NaN if window isn't full
    // if (this.values.length < this.windowSize) {
    //   return null;
    // }
    return this.sum / this.values.length;
  }

 /**
  * Returns the current SMA value, returning 0 if the window is empty.
  * If the window is not full, it calculates the average based on available values.
  */
 getOrDefault(defaultValue: number = 0): number {
    if (this.values.length === 0) {
      return defaultValue;
    }
    return this.sum / this.values.length;
 }

  /**
   * Resets the SMA calculation.
   */
  reset(): void {
    this.values = [];
    this.sum = 0;
  }
} 