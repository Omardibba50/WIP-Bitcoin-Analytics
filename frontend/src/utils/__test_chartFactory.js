/**
 * Quick test to verify chartFactory works correctly
 * Run this in the browser console or as a test
 */

import { createBarChart } from './chartFactory';

// Test 1: Valid datasets array
console.log('=== Test 1: Valid datasets array ===');
const validDatasets = [
  {
    label: 'Test Data',
    data: [10, 20, 30],
    backgroundColor: '#00b3ff',
  }
];
const validLabels = ['A', 'B', 'C'];
const result1 = createBarChart(validDatasets, validLabels);
console.log('Result:', result1);
console.log('Success:', result1.data.datasets.length > 0);

// Test 2: Invalid datasets (not an array)
console.log('\n=== Test 2: Invalid datasets (object instead of array) ===');
const invalidDatasets = {
  label: 'Test Data',
  data: [10, 20, 30],
};
const result2 = createBarChart(invalidDatasets, validLabels);
console.log('Result:', result2);
console.log('Should return empty datasets:', result2.data.datasets.length === 0);

// Test 3: Null datasets
console.log('\n=== Test 3: Null datasets ===');
const result3 = createBarChart(null, validLabels);
console.log('Result:', result3);
console.log('Should return empty datasets:', result3.data.datasets.length === 0);

// Test 4: Undefined datasets
console.log('\n=== Test 4: Undefined datasets ===');
const result4 = createBarChart(undefined, validLabels);
console.log('Result:', result4);
console.log('Should return empty datasets:', result4.data.datasets.length === 0);

console.log('\n=== All tests complete ===');
