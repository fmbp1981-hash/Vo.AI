import OpenAI from 'openai'
import axios from 'axios'
import { getLLMConfig } from './settings'

/**
 * Media Processing Service
 * Handles audio transcription (Whisper) and image analysis (Vision)
 */

/**
 * Transcribe audio file using OpenAI Whisper
 * @param audioUrl - URL or base64 of the audio file
 * @param tenantId - Optional tenant ID for config
 * @returns Transcribed text
 */
export async function transcribeAudio(
    audioUrl: string,
    tenantId?: string
): Promise<string> {
    try {
        // Get OpenAI config (Whisper only works with OpenAI)
        const config = await getLLMConfig(tenantId)

        // Use OpenAI API key (Whisper requires OpenAI)
        let apiKey = config.provider === 'openai' ? config.apiKey : process.env.OPENAI_API_KEY

        if (!apiKey) {
            console.warn('[Whisper] No OpenAI API key available, returning empty transcription')
            return ''
        }

        const openai = new OpenAI({ apiKey })

        // Download audio file
        console.log('[Whisper] Downloading audio from:', audioUrl.substring(0, 50) + '...')

        const response = await axios.get(audioUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        })

        // Create a File-like object for OpenAI
        const audioBuffer = Buffer.from(response.data)
        const audioBlob = new Blob([audioBuffer], { type: 'audio/ogg' })
        const audioFile = new File([audioBlob], 'audio.ogg', { type: 'audio/ogg' })

        console.log('[Whisper] Transcribing audio...')

        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            language: 'pt', // Portuguese
            response_format: 'text'
        })

        console.log('[Whisper] Transcription complete:', transcription.substring(0, 100))
        return transcription
    } catch (error: any) {
        console.error('[Whisper] Transcription error:', error.message)
        return ''
    }
}

/**
 * Analyze image using OpenAI GPT-4 Vision
 * @param imageUrl - URL of the image
 * @param prompt - Optional custom prompt for analysis
 * @param tenantId - Optional tenant ID for config
 * @returns Analysis text
 */
export async function analyzeImage(
    imageUrl: string,
    prompt?: string,
    tenantId?: string
): Promise<string> {
    try {
        // Get OpenAI config (Vision requires OpenAI)
        const config = await getLLMConfig(tenantId)

        // Use OpenAI API key (Vision requires OpenAI GPT-4V)
        let apiKey = config.provider === 'openai' ? config.apiKey : process.env.OPENAI_API_KEY

        if (!apiKey) {
            console.warn('[Vision] No OpenAI API key available, returning empty analysis')
            return ''
        }

        const openai = new OpenAI({ apiKey })

        const defaultPrompt = `Analise esta imagem e descreva seu conteúdo de forma clara e concisa. 
Se for um documento (passaporte, RG, passagem, etc), extraia as informações relevantes.
Se for uma foto de destino turístico, descreva o local.
Responda em português.`

        console.log('[Vision] Analyzing image:', imageUrl.substring(0, 50) + '...')

        const response = await openai.chat.completions.create({
            model: 'gpt-4o', // GPT-4o has vision capabilities
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt || defaultPrompt },
                        { type: 'image_url', image_url: { url: imageUrl, detail: 'auto' } }
                    ]
                }
            ],
            max_tokens: 500
        })

        const analysis = response.choices[0]?.message?.content || ''
        console.log('[Vision] Analysis complete:', analysis.substring(0, 100))
        return analysis
    } catch (error: any) {
        console.error('[Vision] Image analysis error:', error.message)
        return ''
    }
}

/**
 * Download media from Evolution API
 * @param mediaKey - Media key from Evolution API
 * @param instanceName - Evolution instance name
 * @param baseUrl - Evolution API base URL
 * @param apiKey - Evolution API key
 * @returns Base64 encoded media or URL
 */
export async function downloadEvolutionMedia(
    mediaKey: string,
    instanceName: string,
    baseUrl: string,
    apiKey: string
): Promise<string | null> {
    try {
        const response = await axios.get(
            `${baseUrl}/chat/getBase64FromMediaMessage/${instanceName}`,
            {
                headers: { 'apikey': apiKey },
                params: { key: mediaKey },
                timeout: 30000
            }
        )

        if (response.data?.base64) {
            return `data:${response.data.mimetype};base64,${response.data.base64}`
        }

        return null
    } catch (error: any) {
        console.error('[Media] Download error:', error.message)
        return null
    }
}

/**
 * Process different media types and return text representation
 */
export async function processMedia(
    mediaType: 'audio' | 'image' | 'document',
    mediaUrl: string,
    tenantId?: string
): Promise<{ text: string; summary: string }> {
    switch (mediaType) {
        case 'audio':
            const transcription = await transcribeAudio(mediaUrl, tenantId)
            return {
                text: transcription,
                summary: transcription ? `[Áudio transcrito]: ${transcription}` : '[Áudio não transcrito]'
            }

        case 'image':
            const analysis = await analyzeImage(mediaUrl, undefined, tenantId)
            return {
                text: analysis,
                summary: analysis ? `[Imagem analisada]: ${analysis}` : '[Imagem não analisada]'
            }

        case 'document':
            // Document processing would require additional libraries (pdf-parse, etc)
            // For now, just acknowledge the document
            return {
                text: '',
                summary: '[Documento recebido - análise não disponível]'
            }

        default:
            return { text: '', summary: '[Mídia não suportada]' }
    }
}
