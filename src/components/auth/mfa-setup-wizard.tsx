"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Copy, ShieldCheck, Smartphone } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface MFASetupWizardProps {
    onComplete: () => void
    onCancel: () => void
}

export function MFASetupWizard({ onComplete, onCancel }: MFASetupWizardProps) {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [secretData, setSecretData] = useState<{
        secret: string
        qrCodeUrl: string
        backupCodes: string[]
    } | null>(null)
    const [verificationCode, setVerificationCode] = useState('')
    const [error, setError] = useState('')

    const startSetup = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/auth/mfa/setup', { method: 'POST' })
            const result = await response.json()

            if (result.success) {
                setSecretData(result.data)
                setStep(2)
            } else {
                toast.error('Erro ao iniciar configuração do MFA')
            }
        } catch (error) {
            console.error(error)
            toast.error('Erro de conexão')
        } finally {
            setLoading(false)
        }
    }

    const verifyCode = async () => {
        if (verificationCode.length !== 6) return

        setLoading(true)
        setError('')
        try {
            const response = await fetch('/api/auth/mfa/enable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: verificationCode })
            })
            const result = await response.json()

            if (result.success) {
                setStep(3)
                toast.success('MFA ativado com sucesso!')
            } else {
                setError(result.error || 'Código inválido')
                toast.error('Código inválido')
            }
        } catch (error) {
            console.error(error)
            setError('Erro ao verificar código')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copiado para a área de transferência')
    }

    return (
        <div className="max-w-md mx-auto">
            {/* Step 1: Intro */}
            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-blue-600" />
                            Autenticação de Dois Fatores
                        </CardTitle>
                        <CardDescription>
                            Aumente a segurança da sua conta exigindo um código do seu celular ao fazer login.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                            <Smartphone className="w-6 h-6 text-blue-600 mt-1" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">Como funciona:</p>
                                <ol className="list-decimal ml-4 space-y-1">
                                    <li>Você baixa um app autenticador (Google Authenticator, Authy, etc.)</li>
                                    <li>Escaneia um QR Code que vamos mostrar</li>
                                    <li>Digita o código gerado pelo app para confirmar</li>
                                </ol>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
                        <Button onClick={startSetup} disabled={loading}>
                            {loading ? 'Iniciando...' : 'Começar Configuração'}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Step 2: QR Code & Verify */}
            {step === 2 && secretData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Configurar Aplicativo</CardTitle>
                        <CardDescription>
                            Escaneie o QR Code abaixo com seu aplicativo autenticador.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex justify-center bg-white p-4 border rounded-lg">
                            <img
                                src={secretData.qrCodeUrl}
                                alt="QR Code MFA"
                                className="w-48 h-48"
                            />
                        </div>

                        <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground">Não consegue escanear?</p>
                            <div className="flex items-center justify-center gap-2">
                                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                                    {secretData.secret}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => copyToClipboard(secretData.secret)}
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Digite o código de 6 dígitos:</label>
                            <div className="flex gap-2">
                                <Input
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="text-center text-lg tracking-widest"
                                    maxLength={6}
                                />
                                <Button onClick={verifyCode} disabled={loading || verificationCode.length !== 6}>
                                    Verificar
                                </Button>
                            </div>
                            {error && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" className="w-full" onClick={onCancel}>Cancelar</Button>
                    </CardFooter>
                </Card>
            )}

            {/* Step 3: Backup Codes */}
            {step === 3 && secretData && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-6 h-6" />
                            MFA Ativado!
                        </CardTitle>
                        <CardDescription>
                            Salve seus códigos de backup em um local seguro. Você precisará deles se perder acesso ao seu celular.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Importante</AlertTitle>
                            <AlertDescription>
                                Estes códigos só serão mostrados uma vez. Copie-os agora!
                            </AlertDescription>
                        </Alert>

                        <div className="bg-gray-50 p-4 rounded-lg border grid grid-cols-2 gap-2 font-mono text-sm">
                            {secretData.backupCodes.map((code, index) => (
                                <div key={index} className="bg-white px-2 py-1 rounded border text-center">
                                    {code}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => copyToClipboard(secretData.backupCodes.join('\n'))}
                        >
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar Códigos
                        </Button>
                        <Button className="w-full" onClick={onComplete}>
                            Concluir
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}
