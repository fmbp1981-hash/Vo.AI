'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Copy, Shield, Smartphone, Key, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface MFASetupWizardProps {
  userEmail: string
  onComplete?: () => void
}

export function MFASetupWizard({ userEmail, onComplete }: MFASetupWizardProps) {
  const [step, setStep] = useState<'intro' | 'qrcode' | 'verify' | 'backup' | 'complete'>('intro')
  const [secret, setSecret] = useState<string>('')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [verificationCode, setVerificationCode] = useState<string>('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // Gerar segredo MFA
  const generateSecret = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) throw new Error('Erro ao gerar segredo MFA')

      const data = await response.json()
      setSecret(data.secret)
      setQrCodeUrl(data.qrCodeUrl)
      setStep('qrcode')
    } catch (err) {
      setError('Erro ao configurar MFA. Tente novamente.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar código
  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('Código deve ter 6 dígitos')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret,
          token: verificationCode,
        }),
      })

      if (!response.ok) throw new Error('Código inválido')

      const data = await response.json()
      
      if (data.verified) {
        setBackupCodes(data.backupCodes || [])
        setStep('backup')
        toast.success('MFA verificado com sucesso!')
      } else {
        setError('Código incorreto. Tente novamente.')
      }
    } catch (err) {
      setError('Código inválido. Verifique e tente novamente.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Copiar backup codes
  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    toast.success('Códigos copiados!')
  }

  // Finalizar setup
  const completeSetup = () => {
    setStep('complete')
    toast.success('MFA ativado com sucesso!')
    setTimeout(() => {
      onComplete?.()
    }, 2000)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        {['intro', 'qrcode', 'verify', 'backup', 'complete'].map((s, index) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step === s
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : ['qrcode', 'verify', 'backup', 'complete'].indexOf(step) >= ['qrcode', 'verify', 'backup', 'complete'].indexOf(s)
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-gray-300 bg-gray-100 text-gray-400'
              }`}
            >
              {['qrcode', 'verify', 'backup', 'complete'].indexOf(step) > ['qrcode', 'verify', 'backup', 'complete'].indexOf(s) ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </div>
            {index < 4 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  ['qrcode', 'verify', 'backup', 'complete'].indexOf(step) > ['qrcode', 'verify', 'backup', 'complete'].indexOf(s)
                    ? 'bg-green-600'
                    : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step: Intro */}
      {step === 'intro' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <CardTitle>Ativar Autenticação de Dois Fatores</CardTitle>
                <CardDescription>
                  Adicione uma camada extra de segurança à sua conta
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                A autenticação de dois fatores (MFA) protege sua conta mesmo se alguém descobrir sua senha.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                O que você vai precisar:
              </h3>
              <ul className="space-y-2 ml-7 list-disc text-sm text-gray-600">
                <li>Um smartphone com câmera</li>
                <li>Um app autenticador instalado (Google Authenticator, Authy, Microsoft Authenticator)</li>
                <li>Alguns minutos para configurar</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Key className="w-5 h-5" />
                Como funciona:
              </h3>
              <ol className="space-y-2 ml-7 list-decimal text-sm text-gray-600">
                <li>Escaneie um QR code com seu app autenticador</li>
                <li>Digite o código gerado para verificar</li>
                <li>Salve os códigos de backup em local seguro</li>
                <li>Pronto! Sua conta está protegida</li>
              </ol>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={generateSecret} disabled={isLoading} className="w-full">
              {isLoading ? 'Gerando...' : 'Começar Configuração'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step: QR Code */}
      {step === 'qrcode' && (
        <Card>
          <CardHeader>
            <CardTitle>Escaneie o QR Code</CardTitle>
            <CardDescription>
              Use seu app autenticador para escanear o código abaixo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                {qrCodeUrl && <QRCodeSVG value={qrCodeUrl} size={200} />}
              </div>

              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  Abra seu app autenticador e escaneie o QR code acima
                </AlertDescription>
              </Alert>

              <div className="w-full">
                <Label className="text-sm text-gray-600">Ou digite manualmente:</Label>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 p-3 text-sm bg-gray-100 rounded border border-gray-300 font-mono break-all">
                    {secret}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(secret)
                      toast.success('Código copiado!')
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('intro')} className="flex-1">
              Voltar
            </Button>
            <Button onClick={() => setStep('verify')} className="flex-1">
              Continuar
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step: Verify */}
      {step === 'verify' && (
        <Card>
          <CardHeader>
            <CardTitle>Verificar Código</CardTitle>
            <CardDescription>
              Digite o código de 6 dígitos do seu app autenticador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">Código de Verificação</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => {
                  setError('')
                  setVerificationCode(e.target.value.replace(/\D/g, ''))
                }}
                className="text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-xs text-gray-500 text-center">
                O código muda a cada 30 segundos
              </p>
            </div>

            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                Abra seu app autenticador e digite o código de 6 dígitos exibido para <strong>{userEmail}</strong>
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('qrcode')} className="flex-1">
              Voltar
            </Button>
            <Button
              onClick={verifyCode}
              disabled={isLoading || verificationCode.length !== 6}
              className="flex-1"
            >
              {isLoading ? 'Verificando...' : 'Verificar'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step: Backup Codes */}
      {step === 'backup' && (
        <Card>
          <CardHeader>
            <CardTitle>Códigos de Backup</CardTitle>
            <CardDescription>
              Salve estes códigos em um local seguro. Use-os se perder acesso ao seu celular.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>IMPORTANTE:</strong> Guarde estes códigos em local seguro. Cada um pode ser usado apenas uma vez.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              {backupCodes.map((code, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {code}
                  </Badge>
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={copyBackupCodes} className="w-full">
              <Copy className="w-4 h-4 mr-2" />
              Copiar Todos os Códigos
            </Button>
          </CardContent>
          <CardFooter>
            <Button onClick={completeSetup} className="w-full">
              Concluir e Ativar MFA
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step: Complete */}
      {step === 'complete' && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <div>
                <CardTitle className="text-green-900">MFA Ativado!</CardTitle>
                <CardDescription className="text-green-700">
                  Sua conta está agora protegida com autenticação de dois fatores
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Alert className="bg-white border-green-300">
              <Shield className="h-4 w-4 text-green-600" />
              <AlertDescription>
                A partir de agora, você precisará do código do app autenticador sempre que fizer login.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
