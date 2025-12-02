/**
 * Test script for chartFactory functions
 * Run this in browser console to verify fixes
 */

import { createBarChart, createLineChart, createAreaChart } from './chartFactory.js';

console.log('🧪 Starting chartFactory tests...\n');

// Test 1: Valid datasets array
console.log('📊 Test 1: Valid datasets array');
try {
  const validDatasets = [
    {
      label: 'Test Data',
      data: [10, 20, 30],
      backgroundColor: '#00b3ff',
    }
  ];
  const validLabels = ['A', 'B', 'C'];
  const result = createBarChart(validDatasets, validLabels);
  
  if (result.data.datasets.length > 0) {
    console.log('✅ PASS: Valid datasets array works');
  } else {
    console.log('❌ FAIL: Valid datasets array failed');
  }
} catch (err) {
  console.log('❌ FAIL: Exception thrown:', err.message);
}

// Test 2: Invalid datasets (object instead of array)
console.log('\n📊 Test 2: Invalid datasets (object instead of array)');
try {
  const invalidDatasets = {
    label: 'Test Data',
    data: [10, 20, 30],
  };
  const validLabels = ['A', 'B', 'C'];
  const result = createBarChart(invalidDatasets, validLabels);
  
  if (result.data.datasets.length === 0) {
    console.log('✅ PASS: Invalid datasets handled gracefully');
  } else {
    console.log('❌ FAIL: Should have returned empty datasets');
  }
} catch (err) {
  console.log('❌ FAIL: Exception thrown (should not happen):', err.message);
}

// Test 3: Null datasets
console.log('\n📊 Test 3: Null datasets');
try {
  const result = createBarChart(null, ['A', 'B', 'C']);
  
  if (result.data.datasets.length === 0) {
    console.log('✅ PASS: Null datasets handled gracefully');
  } else {
    console.log('❌ FAIL: Should have returned empty datasets');
  }
} catch (err) {
  console.log('❌ FAIL: Exception thrown (should not happen):', err.message);
}

// Test 4: Undefined datasets
console.log('\n📊 Test 4: Undefined datasets');
try {
  const result = createBarChart(undefined, ['A', 'B', 'C']);
  
  if (result.data.datasets.length === 0) {
    console.log('✅ PASS: Undefined datasets handled gracefully');
  } else {
    console.log('❌ FAIL: Should have returned empty datasets');
  }
} catch (err) {
  console.log('❌ FAIL: Exception thrown (should not happen):', err.message);
}

// Test 5: Empty array
console.log('\n📊 Test 5: Empty datasets array');
try {
  const result = createBarChart([], ['A', 'B', 'C']);
  
  if (result.data.datasets.length === 0) {
    console.log('✅ PASS: Empty array handled correctly');
  } else {
    console.log('❌ FAIL: Should have returned empty datasets');
  }
} catch (err) {
  console.log('❌ FAIL: Exception thrown (should not happen):', err.message);
}

// Test 6: createLineChart with valid data
console.log('\n📊 Test 6: createLineChart with valid data');
try {
  const validDatasets = [
    {
      label: 'Line Data',
      data: [5, 10, 15],
      borderColor: '#00b3ff',
    }
  ];
  const result = createLineChart(validDatasets, ['X', 'Y', 'Z']);
  
  if (result.type === 'line' && result.data.datasets.length > 0) {
    console.log('✅ PASS: createLineChart works');
  } else {
    console.log('❌ FAIL: createLineChart failed');
  }
} catch (err) {
  console.log('❌ FAIL: Exception thrown:', err.message);
}

// Test 7: createAreaChart with valid data
console.log('\n📊 Test 7: createAreaChart with valid data');
try {
  const validDatasets = [
    {
      label: 'Area Data',
      data: [5, 10, 15],
      borderColor: '#00b3ff',
    }
  ];
  const result = createAreaChart(validDatasets, ['X', 'Y', 'Z']);
  
  if (result.type === 'line' && result.data.datasets.length > 0) {
    console.log('✅ PASS: createAreaChart works');
  } else {
    console.log('❌ FAIL: createAreaChart failed');
  }
} catch (err) {
  console.log('❌ FAIL: Exception thrown:', err.message);
}

console.log('\n✅ All tests complete!\n');
console.log('Summary:');
console.log('- Valid data: Should work without errors');
console.log('- Invalid data: Should handle gracefully without crashing');
console.log('- No "datasets.map is not a function" errors should occur');
