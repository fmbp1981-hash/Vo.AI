import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { LLMConfig, getAgentConfig } from './settings'

/**
 * Multi-Provider LLM Service
 * Supports OpenAI, Google Gemini, and Anthropic Claude
 */

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export interface LLMResponse {
    content: string
    usage?: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
    }
}

/**
 * Generate a chat completion using the configured LLM provider
 */
export async function generateLLMCompletion(
    messages: ChatMessage[],
    config: LLMConfig,
    tenantId?: string
): Promise<string> {
    // Get agent config for system prompt
    const agentConfig = await getAgentConfig(tenantId)

    // Ensure system message is first
    const systemMessage: ChatMessage = {
        role: 'system',
        content: agentConfig.systemPrompt
    }

    const allMessages = messages[0]?.role === 'system'
        ? messages
        : [systemMessage, ...messages]

    switch (config.provider) {
        case 'openai':
            return generateOpenAICompletion(allMessages, config)
        case 'google':
            return generateGoogleCompletion(allMessages, config)
        case 'anthropic':
            return generateAnthropicCompletion(allMessages, config)
        default:
            throw new Error(`Unknown LLM provider: ${config.provider}`)
    }
}

/**
 * OpenAI GPT completion
 */
async function generateOpenAICompletion(
    messages: ChatMessage[],
    config: LLMConfig
): Promise<string> {
    if (!config.apiKey) {
        throw new Error('OpenAI API key not configured')
    }

    const openai = new OpenAI({ apiKey: config.apiKey })

    const response = await openai.chat.completions.create({
        model: config.model || 'gpt-4o',
        messages: messages.map(m => ({
            role: m.role,
            content: m.content
        })),
        temperature: 0.7,
        max_tokens: 1024
    })

    return response.choices[0]?.message?.content || ''
}

/**
 * Google Gemini completion
 */
async function generateGoogleCompletion(
    messages: ChatMessage[],
    config: LLMConfig
): Promise<string> {
    if (!config.apiKey) {
        throw new Error('Google AI API key not configured')
    }

    const genAI = new GoogleGenerativeAI(config.apiKey)
    const model = genAI.getGenerativeModel({ model: config.model || 'gemini-1.5-pro' })

    // Convert messages to Gemini format
    // Gemini uses a different format - system message goes in systemInstruction
    const systemMessage = messages.find(m => m.role === 'system')
    const chatMessages = messages.filter(m => m.role !== 'system')

    // Create chat with system instruction
    const chat = model.startChat({
        history: chatMessages.slice(0, -1).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        })),
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
        },
        systemInstruction: systemMessage?.content
    })

    // Send the last message
    const lastMessage = chatMessages[chatMessages.length - 1]
    const result = await chat.sendMessage(lastMessage?.content || '')
    const response = await result.response

    return response.text()
}

/**
 * Anthropic Claude completion
 */
async function generateAnthropicCompletion(
    messages: ChatMessage[],
    config: LLMConfig
): Promise<string> {
    if (!config.apiKey) {
        throw new Error('Anthropic API key not configured')
    }

    const anthropic = new Anthropic({ apiKey: config.apiKey })

    // Claude uses system as a separate parameter
    const systemMessage = messages.find(m => m.role === 'system')
    const chatMessages = messages.filter(m => m.role !== 'system')

    const response = await anthropic.messages.create({
        model: config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemMessage?.content || '',
        messages: chatMessages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
        }))
    })

    // Extract text from response
    const textBlock = response.content.find(block => block.type === 'text')
    return textBlock?.type === 'text' ? textBlock.text : ''
}

/**
 * Simple wrapper for quick text generation (single prompt)
 */
export async function generateText(
    prompt: string,
    config: LLMConfig,
    tenantId?: string
): Promise<string> {
    return generateLLMCompletion(
        [{ role: 'user', content: prompt }],
        config,
        tenantId
    )
}

/**
 * Detect if user wants to talk to a human agent
 */
export async function detectHandoverIntentWithLLM(
    message: string,
    config: LLMConfig
): Promise<{ shouldHandover: boolean; confidence: number }> {
    const prompt = `Analyze this message and determine if the user wants to speak with a human agent/consultant.
    
Message: "${message}"

Respond with JSON only:
{"shouldHandover": boolean, "confidence": number between 0-1}

Examples of handover requests:
- "Quero falar com um consultor"
- "Preciso de atendimento humano"
- "Pode me transferir?"
- "Gostaria de falar com alguém"
`

    try {
        const response = await generateLLMCompletion(
            [
                { role: 'system', content: 'You are a classifier. Respond only with valid JSON.' },
                { role: 'user', content: prompt }
            ],
            config
        )

        // Parse JSON response
        const jsonMatch = response.match(/\{[^}]+\}/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
        }
    } catch (error) {
        console.error('Error detecting handover intent:', error)
    }

    return { shouldHandover: false, confidence: 0 }
}
