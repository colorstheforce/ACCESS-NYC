var googleOptimizeId = '{{ GOOGLE_OPTIMIZE_ID }}';
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
if (googleOptimizeId.replace('{{ ', '').replace(' }}') !== 'GOOGLE_OPTIMIZE_ID') {
  gtag('config', '{{ GOOGLE_ANALYTICS }}', {'optimize_id': '{{ GOOGLE_OPTIMIZE_ID }}'});
} else {
  gtag('config', '{{ GOOGLE_ANALYTICS }}');
}