// Kalkulator
const $ = id => document.getElementById(id);
const idr = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');

function hitung(){
  const harga = parseFloat($('harga').value) || 0;
  const berat = parseFloat($('berat').value) || 0;
  const kurs = parseFloat($('kurs').value) || 0;
  const feePct = parseFloat($('fee').value) || 0;
  const ongkirKg = parseFloat($('ongkir').value) || 0;

  const hargaRp = harga * kurs;
  const feeRp = hargaRp * (feePct / 100);
  const ongkirRp = berat * ongkirKg;
  const total = hargaRp + feeRp + ongkirRp;

  $('r-barang').textContent = idr(hargaRp);
  $('r-fee').textContent = idr(feeRp);
  $('r-ongkir').textContent = idr(ongkirRp);
  $('r-total').textContent = idr(total);
}

['harga','berat','kurs','fee','ongkir'].forEach(id => $(id).addEventListener('input', hitung));
hitung();

// FAQ accordion
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');
  q.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(el => {
      el.classList.remove('open');
      el.querySelector('.faq-a').style.maxHeight = null;
    });
    if(!isOpen){
      item.classList.add('open');
      a.style.maxHeight = a.scrollHeight + 'px';
    }
  });
});

// Filter chip (visual only)
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  });
});

// Form submit simulation
document.getElementById('orderForm').addEventListener('submit', function(e){
  e.preventDefault();
  document.getElementById('formMsg').classList.add('show');
  this.reset();
});
