// Test pdf-parse import in ES module context
console.log('Testing pdf-parse import...');

try {
  const pdfParse = await import('pdf-parse');
  console.log('✅ pdf-parse imported successfully');
  console.log('Default export:', typeof pdfParse.default);
} catch (error) {
  console.error('❌ Error importing pdf-parse:', error.message);
  console.error('Stack:', error.stack);
}