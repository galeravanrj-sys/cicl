#!/usr/bin/env node

/**
 * Comprehensive Test Runner for CICL Project
 * Runs all tests across frontend, backend, and integration suites
 * Supports different modes: development, CI, coverage
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  frontend: {
    dir: './frontend',
    testCommand: 'npm run test',
    coverageCommand: 'npm run test:coverage'
  },
  server: {
    dir: './server',
    testCommand: 'npm run test',
    coverageCommand: 'npm run test:coverage'
  },
  integration: {
    dir: './',
    testCommand: 'npm run test:main',
    coverageCommand: 'npm run test:main -- --coverage'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const logSection = (title) => {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`${title}`, colors.bright + colors.cyan);
  log(`${'='.repeat(60)}`, colors.cyan);
};

const logSuccess = (message) => log(`✅ ${message}`, colors.green);
const logError = (message) => log(`❌ ${message}`, colors.red);
const logWarning = (message) => log(`⚠️  ${message}`, colors.yellow);
const logInfo = (message) => log(`ℹ️  ${message}`, colors.blue);

// Check if directory exists and has package.json
const checkDirectory = (dir) => {
  const fullPath = path.resolve(dir);
  const packageJsonPath = path.join(fullPath, 'package.json');
  
  if (!fs.existsSync(fullPath)) {
    logWarning(`Directory ${dir} does not exist`);
    return false;
  }
  
  if (!fs.existsSync(packageJsonPath)) {
    logWarning(`No package.json found in ${dir}`);
    return false;
  }
  
  return true;
};

// Run command in specific directory
const runCommand = (command, cwd, description) => {
  return new Promise((resolve, reject) => {
    logInfo(`Running: ${command} in ${cwd}`);
    
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      cwd: path.resolve(cwd),
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        logSuccess(`${description} completed successfully`);
        resolve(code);
      } else {
        logError(`${description} failed with exit code ${code}`);
        reject(new Error(`${description} failed`));
      }
    });
    
    child.on('error', (error) => {
      logError(`Failed to start ${description}: ${error.message}`);
      reject(error);
    });
  });
};

// Run tests for a specific component
const runComponentTests = async (componentName, componentConfig, withCoverage = false) => {
  logSection(`${componentName.toUpperCase()} TESTS`);
  
  if (!checkDirectory(componentConfig.dir)) {
    logWarning(`Skipping ${componentName} tests - directory not found`);
    return { success: false, skipped: true };
  }
  
  try {
    const command = withCoverage ? componentConfig.coverageCommand : componentConfig.testCommand;
    await runCommand(command, componentConfig.dir, `${componentName} tests`);
    return { success: true, skipped: false };
  } catch (error) {
    return { success: false, skipped: false, error };
  }
};

// Generate coverage report summary
const generateCoverageSummary = () => {
  logSection('COVERAGE SUMMARY');
  
  const coverageDirs = ['./coverage', './frontend/coverage', './server/coverage'];
  let foundCoverage = false;
  
  coverageDirs.forEach(dir => {
    const summaryPath = path.join(dir, 'coverage-summary.json');
    if (fs.existsSync(summaryPath)) {
      try {
        const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
        const total = summary.total;
        
        log(`\n📊 Coverage for ${dir}:`, colors.bright);
        log(`   Lines: ${total.lines.pct}%`, colors.cyan);
        log(`   Functions: ${total.functions.pct}%`, colors.cyan);
        log(`   Branches: ${total.branches.pct}%`, colors.cyan);
        log(`   Statements: ${total.statements.pct}%`, colors.cyan);
        
        foundCoverage = true;
      } catch (error) {
        logWarning(`Could not read coverage summary from ${dir}`);
      }
    }
  });
  
  if (!foundCoverage) {
    logWarning('No coverage reports found');
  }
};

// Main test runner function
const runAllTests = async (options = {}) => {
  const { coverage = false, component = null, failFast = false } = options;
  
  logSection('CICL PROJECT TEST RUNNER');
  logInfo(`Mode: ${coverage ? 'Coverage' : 'Standard'}`);
  logInfo(`Fail Fast: ${failFast ? 'Enabled' : 'Disabled'}`);
  
  if (component) {
    logInfo(`Running tests for: ${component}`);
  } else {
    logInfo('Running all test suites');
  }
  
  const results = {
    frontend: { success: false, skipped: false },
    server: { success: false, skipped: false },
    integration: { success: false, skipped: false }
  };
  
  const componentsToTest = component ? [component] : ['frontend', 'server', 'integration'];
  
  // Run tests for each component
  for (const comp of componentsToTest) {
    if (config[comp]) {
      results[comp] = await runComponentTests(comp, config[comp], coverage);
      
      if (failFast && !results[comp].success && !results[comp].skipped) {
        logError('Stopping due to fail-fast mode');
        break;
      }
    } else {
      logWarning(`Unknown component: ${comp}`);
    }
  }
  
  // Generate final report
  logSection('TEST RESULTS SUMMARY');
  
  let totalTests = 0;
  let passedTests = 0;
  let skippedTests = 0;
  
  Object.entries(results).forEach(([name, result]) => {
    if (componentsToTest.includes(name)) {
      totalTests++;
      if (result.success) {
        logSuccess(`${name}: PASSED`);
        passedTests++;
      } else if (result.skipped) {
        logWarning(`${name}: SKIPPED`);
        skippedTests++;
      } else {
        logError(`${name}: FAILED`);
      }
    }
  });
  
  log(`\n📈 Summary:`, colors.bright);
  log(`   Total: ${totalTests}`, colors.cyan);
  log(`   Passed: ${passedTests}`, colors.green);
  log(`   Failed: ${totalTests - passedTests - skippedTests}`, colors.red);
  log(`   Skipped: ${skippedTests}`, colors.yellow);
  
  if (coverage) {
    generateCoverageSummary();
  }
  
  // Exit with appropriate code
  const allPassed = passedTests === totalTests - skippedTests;
  if (allPassed) {
    logSuccess('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    logError('\n💥 Some tests failed!');
    process.exit(1);
  }
};

// Parse command line arguments
const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    coverage: false,
    component: null,
    failFast: false,
    help: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--coverage':
      case '-c':
        options.coverage = true;
        break;
      case '--component':
        options.component = args[++i];
        break;
      case '--fail-fast':
      case '-f':
        options.failFast = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (arg.startsWith('--')) {
          logWarning(`Unknown option: ${arg}`);
        }
    }
  }
  
  return options;
};

// Show help
const showHelp = () => {
  log('CICL Project Test Runner', colors.bright + colors.cyan);
  log('\nUsage: node test-runner.js [options]', colors.bright);
  log('\nOptions:');
  log('  --coverage, -c     Run tests with coverage reporting');
  log('  --component <name> Run tests for specific component (frontend, server, integration)');
  log('  --fail-fast, -f    Stop on first test failure');
  log('  --help, -h         Show this help message');
  log('\nExamples:');
  log('  node test-runner.js                    # Run all tests');
  log('  node test-runner.js --coverage         # Run all tests with coverage');
  log('  node test-runner.js --component frontend  # Run only frontend tests');
  log('  node test-runner.js --fail-fast        # Stop on first failure');
};

// Main execution
if (require.main === module) {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  runAllTests(options).catch((error) => {
    logError(`Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runAllTests, runComponentTests };