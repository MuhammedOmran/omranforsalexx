// Temporary fix to disable problematic features
export function temporarilyDisableFeature(featureName: string) {
  console.log(`Feature ${featureName} temporarily disabled`);
  return false;
}