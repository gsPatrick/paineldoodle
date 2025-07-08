"use client"

import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import * as Avatar from "@radix-ui/react-avatar"
import {
  DashboardIcon,
  PersonIcon,
  ArchiveIcon,
  LayersIcon,
  FileTextIcon,
  ScissorsIcon,
  BarChartIcon,
  ReaderIcon,
  GearIcon,
  ExitIcon,
  HamburgerMenuIcon,
  CodeSandboxLogoIcon,
  RocketIcon,
  IdCardIcon,
} from "@radix-ui/react-icons"

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: DashboardIcon },
    { path: "/usuarios", label: "Usuários", icon: PersonIcon },
    { path: "/produtos", label: "Produtos", icon: ArchiveIcon },
    { path: "/categorias", label: "Categorias", icon: LayersIcon },
    { path: "/pedidos", label: "Pedidos", icon: FileTextIcon },
    { path: "/cupons", label: "Cupons", icon: ScissorsIcon },
    { path: "/planos", label: "Planos", icon: RocketIcon },
    { path: "/assinantes", label: "Assinantes", icon: IdCardIcon },
    { path: "/fretes", label: "Fretes", icon: CodeSandboxLogoIcon },
    { path: "/relatorios", label: "Relatórios", icon: BarChartIcon },
    { path: "/blog", label: "Blog", icon: ReaderIcon },
    { path: "/perfil", label: "Perfil", icon: PersonIcon },
    { path: "/configuracoes", label: "Configurações", icon: GearIcon },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out lg:translate-x-0`}
      >
        <div className="flex items-center justify-center px-4 border-b border-gray-200" style={{ height: '73px' }}>
          <h1 className="text-xl font-bold text-gray-900">Painel</h1>
        </div>

        <nav className="mt-2">
          <div className="px-4 space-y-2 overflow-y-auto" style={{ height: 'calc(100vh - 120px)' }}>
            {menuItems.map((item) => {
              const Icon = item.icon

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded transition-colors ${isActive(item.path)
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {Icon && <Icon className="w-5 h-5 mr-3" />}
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
              >
                <HamburgerMenuIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center space-x-3 text-sm rounded p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-gray-100 focus:ring-blue-500">
                    <Avatar.Root className="w-8 h-8">
                      <Avatar.Image className="w-8 h-8 rounded-full" src={user?.avatar} alt={user?.nome} />
                      <Avatar.Fallback className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                        {user?.nome?.charAt(0)?.toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <span className="hidden md:block text-gray-700 font-medium">{user?.nome}</span>
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="min-w-[200px] bg-white rounded-md p-2 shadow-lg border border-gray-200 mt-4 mr-2"
                    sideOffset={5}
                  >
                    <DropdownMenu.Item className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 cursor-pointer" asChild>
                      <Link to="/perfil">
                        <PersonIcon className="w-4 h-4 mr-2" />
                        Perfil
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                    <DropdownMenu.Item
                      className="flex items-center px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                      onClick={logout}
                    >
                      <ExitIcon className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

export default Layout
