import { PDFDocument } from 'pdf-lib'
import type { PageItem, Quality } from './types'

const A4 = { portrait: [595.28, 841.89], landscape: [841.89, 595.28] } as const
export async function processedJpeg(page: PageItem, quality: Quality) {
  const image = await createImageBitmap(page.file)
  const scale = quality === 'high' ? 1 : quality === 'balanced' ? .78 : .58
  const max = Math.max(1200, Math.round(Math.max(image.width, image.height) * scale))
  const ratio = Math.min(1, max / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * ratio); canvas.height = Math.round(image.height * ratio)
  const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0, canvas.width, canvas.height); image.close()
  if (page.mode !== 'color') { const d = ctx.getImageData(0, 0, canvas.width, canvas.height); for (let i=0;i<d.data.length;i+=4) { const l=.2126*d.data[i]+.7152*d.data[i+1]+.0722*d.data[i+2]; const v=page.mode==='gray'?l:(l>=page.threshold?255:0); d.data[i]=d.data[i+1]=d.data[i+2]=v } ctx.putImageData(d,0,0) }
  const blob = await new Promise<Blob>((ok, bad) => canvas.toBlob(b => b ? ok(b) : bad(new Error('Could not process image')), 'image/jpeg', quality === 'high' ? .92 : quality === 'balanced' ? .78 : .58))
  return new Uint8Array(await blob.arrayBuffer())
}
export async function generatePdf(pages: PageItem[], quality: Quality, onProgress?: (n:number)=>void) {
  const pdf = await PDFDocument.create()
  for (let i=0;i<pages.length;i++) { const page=pages[i], portrait=page.height>=page.width, size: [number,number]=portrait?[...A4.portrait]:[...A4.landscape]; const out=pdf.addPage(size); const image=await pdf.embedJpg(await processedJpeg(page, quality)); const scale=Math.max(size[0]/image.width,size[1]/image.height); const w=image.width*scale,h=image.height*scale; out.drawImage(image,{x:(size[0]-w)/2,y:(size[1]-h)/2,width:w,height:h}); onProgress?.(i+1) }
  return pdf.save()
}
