/**
 * Test manuale per retryAsync
 */

const { retryAsync } = require('./retry');

async function test1() {
  console.log('\n📋 TEST 1: Non dovrebbe riprovare in caso di successo');
  let callCount = 0;
  const successFn = async () => {
    callCount++;
    return "success";
  };
  
  try {
    const result = await retryAsync(successFn);
    console.log(`✅ Test 1 superato: ${callCount === 1 ? 'OK' : 'FALLITO'} (chiamate: ${callCount}, risultato: ${result})`);
    return true;
  } catch (e) {
    console.log(`❌ Test 1 fallito con errore: ${e.message}`);
    return false;
  }
}

async function test2() {
  console.log('\n📋 TEST 2: Dovrebbe riprovare in caso di errore');
  let callCount = 0;
  const failThenSucceedFn = async () => {
    callCount++;
    if (callCount === 1) {
      throw new Error("Temporary error");
    }
    return "success after retry";
  };
  
  try {
    const result = await retryAsync(failThenSucceedFn, 2, 10);
    console.log(`✅ Test 2 superato: ${callCount === 2 ? 'OK' : 'FALLITO'} (chiamate: ${callCount}, risultato: ${result})`);
    return true;
  } catch (e) {
    console.log(`❌ Test 2 fallito con errore: ${e.message}`);
    return false;
  }
}

async function test3() {
  console.log('\n📋 TEST 3: Dovrebbe lanciare un\'eccezione dopo troppi tentativi');
  let callCount = 0;
  const alwaysFailFn = async () => {
    callCount++;
    throw new Error("Persistent error");
  };
  
  try {
    await retryAsync(alwaysFailFn, 2, 10);
    console.log(`❌ Test 3 fallito: doveva lanciare un'eccezione ma non l'ha fatto`);
    return false;
  } catch (e) {
    const correctErrorMsg = e.message === "Persistent error";
    const correctCallCount = callCount === 3;
    console.log(`✅ Test 3 superato: ${correctErrorMsg && correctCallCount ? 'OK' : 'FALLITO'} (chiamate: ${callCount}, errore: ${e.message})`);
    return correctErrorMsg && correctCallCount;
  }
}

async function test4() {
  console.log('\n📋 TEST 4: Dovrebbe rispettare il ritardo tra tentativi');
  let callCount = 0;
  const startTime = Date.now();
  const failThenSucceedWithDelayFn = async () => {
    callCount++;
    if (callCount === 1) {
      throw new Error("Temporary error");
    }
    return "success after retry";
  };
  
  try {
    await retryAsync(failThenSucceedWithDelayFn, 2, 50);
    const duration = Date.now() - startTime;
    const correctDuration = duration >= 40;
    console.log(`✅ Test 4 superato: ${correctDuration && callCount === 2 ? 'OK' : 'FALLITO'} (chiamate: ${callCount}, durata: ${duration}ms)`);
    return correctDuration && callCount === 2;
  } catch (e) {
    console.log(`❌ Test 4 fallito con errore: ${e.message}`);
    return false;
  }
}

async function runTests() {
  console.log('=== INIZIO TEST PER retryAsync ===');
  
  let passed = 0;
  let total = 4;
  
  if (await test1()) passed++;
  if (await test2()) passed++;
  if (await test3()) passed++;
  if (await test4()) passed++;
  
  console.log(`\n=== RISULTATI TEST: ${passed}/${total} test superati ===`);
}

runTests().catch(e => console.error('Errore globale nei test:', e)); 