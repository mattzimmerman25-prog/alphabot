import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Max 60 seconds on Vercel Pro

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const maxItems = body.max_items || 5

    // Check if we're running on Vercel
    const isVercel = process.env.VERCEL === '1'

    if (isVercel) {
      // On Vercel, we have strict time limits
      // Return instructions instead of running the full pipeline
      return NextResponse.json({
        message: 'Full pipeline requires longer execution time than Vercel allows',
        instructions: [
          'The Python backend must be run separately (locally or on a dedicated server)',
          'Generated theses will appear in the dashboard once files are created',
          'To run locally: cd alphabot && python main.py',
          'For production: Deploy Python backend to Railway/Render/Heroku'
        ],
        alternative: 'Use the local Python CLI: python main.py --max-items ' + maxItems,
        status: 'pending'
      }, { status: 202 })
    }

    // If running locally (not on Vercel), try to execute Python
    const pythonDir = path.join(process.cwd())

    try {
      console.log('Executing Python pipeline...')

      const command = `python main.py --max-items ${maxItems} --min-confidence 70`

      // Set a timeout slightly less than Vercel's limit
      const { stdout, stderr } = await execAsync(command, {
        cwd: pythonDir,
        timeout: 55000, // 55 seconds
        env: {
          ...process.env,
          PYTHONPATH: pythonDir
        }
      })

      if (stderr && !stderr.includes('✓')) {
        console.error('Python stderr:', stderr)
      }

      console.log('Python stdout:', stdout)

      return NextResponse.json({
        message: 'Theses generated successfully',
        output: stdout,
        status: 'completed'
      })

    } catch (execError: any) {
      console.error('Python execution error:', execError)

      // Check if it's a timeout
      if (execError.killed || execError.signal === 'SIGTERM') {
        return NextResponse.json({
          message: 'Pipeline timeout - execution takes longer than API route allows',
          instructions: [
            'Run the pipeline locally: python main.py',
            'Or schedule it via cron/Task Scheduler',
            'The web dashboard will display theses once generated'
          ],
          status: 'timeout'
        }, { status: 408 })
      }

      // Other execution error
      return NextResponse.json({
        error: 'Failed to execute pipeline',
        message: execError.message,
        stderr: execError.stderr,
        status: 'error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate theses',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
