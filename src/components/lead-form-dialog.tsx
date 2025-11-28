'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const leadFormSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().min(10, 'Telefone inválido').optional().or(z.literal('')),
  destino: z.string().optional(),
  dataPartida: z.date().optional(),
  dataRetorno: z.date().optional(),
  orcamento: z.number().positive('Orçamento deve ser positivo').optional(),
  pessoas: z.number().int().positive().default(1),
  observacoes: z.string().optional(),
  canal: z.enum(['WHATSAPP', 'WEBCHAT', 'INSTAGRAM', 'EMAIL', 'TELEFONE', 'PRESENCIAL']).default('WHATSAPP'),
  estagio: z.enum(['Novo Lead', 'Qualificação', 'Proposta Enviada', 'Negociação', 'Fechado', 'Pós-Venda', 'Perdido']).default('Novo Lead'),
  tipoViagem: z.enum(['nacional', 'internacional']).default('nacional'),
  origem: z.string().optional(),
  empresaTrabalho: z.string().optional(),
  profissao: z.string().optional(),
})

type LeadFormValues = z.infer<typeof leadFormSchema>

interface LeadFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: any // Lead existente para edição
  onSuccess?: () => void
}

export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
  onSuccess,
}: LeadFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: lead
      ? {
          nome: lead.nome,
          email: lead.email || '',
          telefone: lead.telefone || '',
          destino: lead.destino || '',
          dataPartida: lead.dataPartida ? new Date(lead.dataPartida) : undefined,
          dataRetorno: lead.dataRetorno ? new Date(lead.dataRetorno) : undefined,
          orcamento: lead.orcamento || undefined,
          pessoas: lead.pessoas || 1,
          observacoes: lead.observacoes || '',
          canal: lead.canal || 'WHATSAPP',
          estagio: lead.estagio || 'Novo Lead',
          tipoViagem: lead.tipoViagem || 'nacional',
          origem: lead.origem || '',
          empresaTrabalho: lead.empresaTrabalho || '',
          profissao: lead.profissao || '',
        }
      : {
          pessoas: 1,
          canal: 'WHATSAPP',
          estagio: 'Novo Lead',
          tipoViagem: 'nacional',
        },
  })

  const onSubmit = async (data: LeadFormValues) => {
    setIsSubmitting(true)

    try {
      const url = lead ? `/api/leads/${lead.id}` : '/api/leads'
      const method = lead ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar lead')
      }

      toast.success(lead ? 'Lead atualizado com sucesso!' : 'Lead criado com sucesso!')
      onOpenChange(false)
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Error saving lead:', error)
      toast.error('Erro ao salvar lead. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
          <DialogDescription>
            {lead
              ? 'Atualize as informações do lead'
              : 'Preencha os dados para criar um novo lead'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome */}
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email e Telefone */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field}) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Destino e Pessoas */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="destino"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destino</FormLabel>
                    <FormControl>
                      <Input placeholder="Paris, França" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pessoas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Pessoas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataPartida"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Partida</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ptBR })
                            ) : (
                              <span className="text-muted-foreground">Selecione</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataRetorno"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Retorno</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ptBR })
                            ) : (
                              <span className="text-muted-foreground">Selecione</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < (form.watch('dataPartida') || new Date())
                          }
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Orçamento */}
            <FormField
              control={form.control}
              name="orcamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orçamento</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="10000"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Valor em reais (R$)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Canal e Estágio */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="canal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o canal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                        <SelectItem value="WEBCHAT">Webchat</SelectItem>
                        <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                        <SelectItem value="EMAIL">E-mail</SelectItem>
                        <SelectItem value="TELEFONE">Telefone</SelectItem>
                        <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estagio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estágio</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o estágio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Novo Lead">Novo Lead</SelectItem>
                        <SelectItem value="Qualificação">Qualificação</SelectItem>
                        <SelectItem value="Proposta Enviada">Proposta Enviada</SelectItem>
                        <SelectItem value="Negociação">Negociação</SelectItem>
                        <SelectItem value="Fechado">Fechado</SelectItem>
                        <SelectItem value="Pós-Venda">Pós-Venda</SelectItem>
                        <SelectItem value="Perdido">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tipo de Viagem */}
            <FormField
              control={form.control}
              name="tipoViagem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Viagem</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nacional">🇧🇷 Nacional</SelectItem>
                      <SelectItem value="internacional">🌍 Internacional</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Importante para personalizar lembretes de documentação
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre o lead..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {lead ? 'Atualizar' : 'Criar Lead'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
