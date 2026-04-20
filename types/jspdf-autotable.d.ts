declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf'

  interface UserOptions {
    head?: string[][]
    body?: string[][]
    startY?: number
    theme?: 'striped' | 'grid' | 'plain'
    headStyles?: {
      fillColor?: number[]
      textColor?: number[]
      fontSize?: number
    }
    styles?: {
      fontSize?: number
      cellPadding?: number
    }
  }

  export default function autoTable(doc: jsPDF, options: UserOptions): void
}
