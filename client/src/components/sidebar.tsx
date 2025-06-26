import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  PlusCircle, 
  CheckSquare, 
  Users, 
  Settings, 
  UserCheck, 
  Building, 
  HeadphonesIcon, 
  ChartBar, 
  TrendingUp,
  LucideIcon,
  PanelLeftClose 
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { Button } from "@/components/ui/button";

type NavigationItem = {
  name: string;
  href: string;
  icon: LucideIcon | null;
};

const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Lançamento", href: "/time-entries", icon: PlusCircle },
  { name: "Manutenção", href: "/activities", icon: CheckSquare },
  { name: "separator", href: "", icon: null },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Serviços", href: "/services", icon: Settings },
  { name: "Consultores", href: "/consultants", icon: UserCheck },
  { name: "Setor", href: "/sectors", icon: Building },
  { name: "Tipo Atendimento", href: "/service-types", icon: HeadphonesIcon },
  { name: "separator", href: "", icon: null },
  { name: "Relatórios", href: "/reports", icon: ChartBar },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
];

export function Sidebar() {
  const [location] = useLocation();
  const { isOpen, toggle } = useSidebar();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggle}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-xl
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-700">
          <div>
            <h1 className="text-xl font-bold">Gestão de Horas</h1>
            <p className="text-blue-200 text-sm">Sistema de Controle</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className="text-blue-200 hover:text-white hover:bg-blue-700"
          >
            <PanelLeftClose className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item, index) => {
            if (item.name === "separator") {
              return <hr key={`separator-${index}`} className="my-4 border-blue-700" />;
            }

            const Icon = item.icon;
            const isActive = location === item.href;

            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium 
                    transition-all duration-200 cursor-pointer group
                    ${isActive 
                      ? 'bg-blue-700 text-white shadow-md' 
                      : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                    }
                  `}
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 1024) {
                      toggle();
                    }
                  }}
                >
                  {Icon && (
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'}`} />
                  )}
                  <span className="truncate">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-blue-700">
          <div className="text-xs text-blue-300">
            © 2025 Sistema de Gestão
          </div>
        </div>
      </aside>
    </>
  );
}