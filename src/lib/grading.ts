/**
 * Zambian Education System Grading Utilities
 * Supports both Primary and Secondary education levels
 * 
 * PRIMARY (JSSLC - Junior Secondary School Leaving Certificate):
 * Grade One:   75% And Above
 * Grade Two:   60% - 74%
 * Grade Three: 50% - 59%
 * Grade Four:  40% - 49%
 * Fail:        0% - 39%
 *
 * SECONDARY (School Certificate and GCE):
 * Grade One:   75% - 100%  (Distinction)
 * Grade Two:   70% - 74%   (Distinction)
 * Grade Three: 65% - 69%   (Merit)
 * Grade Four:  60% - 64%   (Merit)
 * Grade Five:  55% - 59%   (Credit)
 * Grade Six:   50% - 54%   (Credit)
 * Grade Seven: 45% - 49%   (Satisfactory)
 * Grade Eight: 40% - 44%   (Satisfactory)
 * Grade Nine:  0% - 39%    (Unsatisfactory)
 */

export type EducationLevel = 'primary' | 'secondary' | string;

export function isPrimaryEducation(level: EducationLevel): boolean {
  return level?.toString().toLowerCase() === 'primary';
}

export function isSecondaryEducation(level: EducationLevel): boolean {
  const normalized = level?.toString().toLowerCase();
  return normalized === 'secondary' || normalized === 'senior';
}

export function calculatePercentage(score: number, outOf: number): number {
  if (outOf <= 0) return 0;
  return (score / outOf) * 100;
}

export function getPassThreshold(level: EducationLevel): number {
  // Primary (JSSLC) uses 40% minimum; Secondary uses 40% minimum
  return 40;
}

export function isPassingGrade(
  score: number,
  maxMark: number,
  level: EducationLevel
): boolean {
  const percent = calculatePercentage(score, maxMark);
  return percent >= getPassThreshold(level);
}

export function isQualityPass(
  score: number,
  maxMark: number,
  level: EducationLevel
): boolean {
  // Quality pass is Grade One (75% or higher) for both levels
  const percent = calculatePercentage(score, maxMark);
  return percent >= 75;
}

/**
 * Get grade label for Zambian Education System
 * 
 * PRIMARY (JSSLC): One, Two, Three, Four, Fail
 * SECONDARY (School Certificate): One, Two, Three, Four, Five, Six, Seven, Eight, Nine
 */
export function getGradeLabel(
  score: number,
  maxMark: number,
  level: EducationLevel = 'secondary'
): string {
  const percentage = calculatePercentage(score, maxMark);

  if (isPrimaryEducation(level)) {
    // PRIMARY GRADES (JSSLC)
    if (percentage >= 75) return 'One';      // Grade One (75% And Above)
    if (percentage >= 60) return 'Two';      // Grade Two (60% - 74%)
    if (percentage >= 50) return 'Three';    // Grade Three (50% - 59%)
    if (percentage >= 40) return 'Four';     // Grade Four (40% - 49%)
    return 'Fail';                           // Fail (0% - 39%)
  }

  // SECONDARY GRADES (School Certificate and GCE)
  if (percentage >= 75) return 'One';      // Grade One (75% - 100%)
  if (percentage >= 70) return 'Two';      // Grade Two (70% - 74%)
  if (percentage >= 65) return 'Three';    // Grade Three (65% - 69%)
  if (percentage >= 60) return 'Four';     // Grade Four (60% - 64%)
  if (percentage >= 55) return 'Five';     // Grade Five (55% - 59%)
  if (percentage >= 50) return 'Six';      // Grade Six (50% - 54%)
  if (percentage >= 45) return 'Seven';    // Grade Seven (45% - 49%)
  if (percentage >= 40) return 'Eight';    // Grade Eight (40% - 44%)
  return 'Nine';                           // Grade Nine (0% - 39%)
}

/**
 * Get the standard/descriptor for the grade (for display purposes)
 * 
 * PRIMARY (JSSLC): Distinction, Merit, Credit, Pass, Fail
 * SECONDARY (School Certificate): Distinction, Merit, Credit, Satisfactory, Unsatisfactory
 */
export function getGradeStandard(
  score: number,
  maxMark: number,
  level: EducationLevel = 'secondary'
): string {
  const percentage = calculatePercentage(score, maxMark);

  if (isPrimaryEducation(level)) {
    // PRIMARY STANDARDS (JSSLC)
    if (percentage >= 75) return 'Distinction';      // Grade One
    if (percentage >= 60) return 'Merit';            // Grade Two
    if (percentage >= 50) return 'Credit';           // Grade Three
    if (percentage >= 40) return 'Pass';             // Grade Four
    return 'Fail';                                   // Fail
  }

  // SECONDARY STANDARDS (School Certificate and GCE)
  if (percentage >= 75) return 'Distinction';      // Grade One
  if (percentage >= 70) return 'Distinction';      // Grade Two
  if (percentage >= 65) return 'Merit';            // Grade Three
  if (percentage >= 60) return 'Merit';            // Grade Four
  if (percentage >= 55) return 'Credit';           // Grade Five
  if (percentage >= 50) return 'Credit';           // Grade Six
  if (percentage >= 45) return 'Satisfactory';     // Grade Seven
  if (percentage >= 40) return 'Satisfactory';     // Grade Eight
  return 'Unsatisfactory';                         // Grade Nine
}

/**
 * Get color code for grade (for UI display)
 */
export function getGradeColor(
  score: number,
  maxMark: number,
  level: EducationLevel = 'secondary'
): {
  bg: string;
  text: string;
  border: string;
} {
  const percentage = calculatePercentage(score, maxMark);

  if (isPrimaryEducation(level)) {
    // PRIMARY COLORS (JSSLC)
    // Distinction (Grade One: 75%+)
    if (percentage >= 75)
      return { bg: '#ECFDF5', text: '#065F46', border: '#10B981' }; // Green
    
    // Merit (Grade Two: 60-74%)
    if (percentage >= 60)
      return { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' }; // Blue
    
    // Credit (Grade Three: 50-59%)
    if (percentage >= 50)
      return { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' }; // Orange
    
    // Pass (Grade Four: 40-49%)
    if (percentage >= 40)
      return { bg: '#FED7AA', text: '#B45309', border: '#F97316' }; // Amber
    
    // Fail (0-39%)
    return { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' }; // Red
  }

  // SECONDARY COLORS (School Certificate)
  // Distinction (Grade One & Two: 70%+)
  if (percentage >= 70)
    return { bg: '#ECFDF5', text: '#065F46', border: '#10B981' }; // Green

  // Merit (Grade Three & Four: 60-69%)
  if (percentage >= 60)
    return { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' }; // Blue

  // Credit (Grade Five & Six: 50-59%)
  if (percentage >= 50)
    return { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' }; // Orange

  // Satisfactory (Grade Seven & Eight: 40-49%)
  if (percentage >= 40)
    return { bg: '#FED7AA', text: '#B45309', border: '#F97316' }; // Amber

  // Unsatisfactory (Grade Nine: 0-39%)
  return { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' }; // Red
}

/**
 * Get performance message based on grade
 * Includes emoji and full grade descriptor
 */
export function getPerformanceMessage(
  score: number,
  maxMark: number,
  level: EducationLevel = 'secondary'
): string {
  const percentage = calculatePercentage(score, maxMark);

  if (isPrimaryEducation(level)) {
    // PRIMARY PERFORMANCE MESSAGES (JSSLC)
    if (percentage >= 75) return '🌟 Excellent - Grade One (Distinction)';
    if (percentage >= 60) return '✅ Good - Grade Two (Merit)';
    if (percentage >= 50) return '👍 Satisfactory - Grade Three (Credit)';
    if (percentage >= 40) return '📈 Acceptable - Grade Four (Pass)';
    return '⚠️ Below Standard - Fail';
  }

  // SECONDARY PERFORMANCE MESSAGES (School Certificate)
  if (percentage >= 75) return '🌟 Excellent - Grade One (Distinction)';
  if (percentage >= 70) return '⭐ Very Good - Grade Two (Distinction)';
  if (percentage >= 65) return '✅ Good - Grade Three (Merit)';
  if (percentage >= 60) return '✅ Good - Grade Four (Merit)';
  if (percentage >= 55) return '👍 Satisfactory - Grade Five (Credit)';
  if (percentage >= 50) return '👍 Satisfactory - Grade Six (Credit)';
  if (percentage >= 45) return '📈 Acceptable - Grade Seven (Satisfactory)';
  if (percentage >= 40) return '📈 Acceptable - Grade Eight (Satisfactory)';
  return '⚠️ Below Standard - Grade Nine (Unsatisfactory)';
}

/**
 * Get overall performance rating based on average score
 */
export function getOverallPerformance(
  scores: number[],
  maxMarks: number[],
  level: EducationLevel = 'secondary'
): string {
  if (scores.length === 0) return 'No data';

  let totalPercentage = 0;
  let count = 0;

  for (let i = 0; i < scores.length; i++) {
    const percentage = calculatePercentage(scores[i], maxMarks[i] || 100);
    totalPercentage += percentage;
    count++;
  }

  const averagePercentage = totalPercentage / count;

  if (isPrimaryEducation(level)) {
    // PRIMARY OVERALL PERFORMANCE (JSSLC)
    if (averagePercentage >= 75) return 'Excellent Performance';
    if (averagePercentage >= 60) return 'Good Performance';
    if (averagePercentage >= 50) return 'Satisfactory Performance';
    if (averagePercentage >= 40) return 'Acceptable Performance';
    return 'Critical Support Needed';
  }

  // SECONDARY OVERALL PERFORMANCE (School Certificate)
  if (averagePercentage >= 75) return 'Excellent Performance';
  if (averagePercentage >= 70) return 'Very Good Performance';
  if (averagePercentage >= 65) return 'Good Performance';
  if (averagePercentage >= 60) return 'Good Performance';
  if (averagePercentage >= 55) return 'Satisfactory Performance';
  if (averagePercentage >= 50) return 'Satisfactory Performance';
  if (averagePercentage >= 45) return 'Acceptable Performance';
  if (averagePercentage >= 40) return 'Needs Improvement';
  return 'Critical Support Needed';
}

/**
 * Get a short performance level descriptor
 */
export function getPerformanceLevel(
  score: number,
  maxMark: number,
  level: EducationLevel = 'secondary'
): string {
  const percentage = calculatePercentage(score, maxMark);

  if (isPrimaryEducation(level)) {
    // PRIMARY LEVELS (JSSLC)
    if (percentage >= 75) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 50) return 'Satisfactory';
    if (percentage >= 40) return 'Acceptable';
    return 'Poor';
  }

  // SECONDARY LEVELS (School Certificate)
  if (percentage >= 75) return 'Excellent';
  if (percentage >= 70) return 'Very Good';
  if (percentage >= 65) return 'Good';
  if (percentage >= 60) return 'Good';
  if (percentage >= 55) return 'Satisfactory';
  if (percentage >= 50) return 'Satisfactory';
  if (percentage >= 45) return 'Acceptable';
  if (percentage >= 40) return 'Fair';
  return 'Poor';
}