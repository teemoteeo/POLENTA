// Copia pubblica del deck (/pitch/, vedi prebuild in package.json): una pressione per slide.
// Una slide tiene un passo in più solo dove un blocco viene sostituito (data-until), così non si perde niente.
const stops = s => { const m = maxStep(s); return [...new Set($$('[data-until]', s).map(e => +e.dataset.until).filter(u => u < m)), m].sort((a, b) => a - b) }
const stepGo = go
go = (i, st) => stepGo(i, st ?? stops(slides[clamp(i, 0, slides.length - 1)])[0])
next = () => { const st = stops(slides[cur]).find(x => x > step); if (st != null) go(cur, st); else if (cur < slides.length - 1) go(cur + 1) }
prev = () => { const st = stops(slides[cur]).filter(x => x < step).pop(); if (st != null) go(cur, st); else if (cur > 0) go(cur - 1, maxStep(slides[cur - 1])) }
if (!location.hash.includes('.') || step === 0) go(cur)
