"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bell,
  Search,
  Settings,
  LogOut,
  User,
  HelpCircle,
  Moon,
  Sun
} from 'lucide-react'

export function Header() {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar leads, conversas, roteiros..."
            className="pl-10 bg-background border-border focus:border-primary focus:ring-primary"
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5 text-foreground" />
              <Badge className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full p-0 flex items-center justify-center border-2 border-card">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div className="flex items-start gap-3 w-full">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Novo lead qualificado</p>
                  <p className="text-xs text-muted-foreground">Maria Santos está pronta para proposta</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Há 2 minutos</p>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex items-start gap-3 w-full">
                <div className="w-2 h-2 bg-secondary rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Proposta visualizada</p>
                  <p className="text-xs text-muted-foreground">Carlos Silva abriu a proposta Europa 2024</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Há 15 minutos</p>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex items-start gap-3 w-full">
                <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Follow-up necessário</p>
                  <p className="text-xs text-muted-foreground">5 leads precisam de contato hoje</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Há 1 hora</p>
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">JD</span>
              </div>
              <span className="text-sm font-medium text-foreground">João Silva</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="w-4 h-4 mr-2" />
              Ajuda
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}