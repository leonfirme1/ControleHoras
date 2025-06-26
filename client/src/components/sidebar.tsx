import { Link, useLocation } from "wouter";
import { 
  Clock, 
  BarChart3, 
  Users, 
  Settings, 
  UserCheck, 
  PlusCircle, 
  ChartBar,
  CheckSquare,
  Building,
  HeadphonesIcon,
  LucideIcon,
  ChevronLeft,
  PanelLeftClose,
  Receipt,
  TrendingUp
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
  const { isOpen, close, toggle } = useSidebar();

  return (
    <>
      {/* Overlay for mobile - only close when clicking outside on very small screens */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={close}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed left-0 top-0 z-50 h-full w-64 transform bg-slate-900 text-white transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 p-4">
          <h2 className="text-lg font-semibold">Gestão de Horas</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={close}
            className="text-slate-400 hover:text-white md:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            if (item.name === "separator") {
              return <hr key={item.name} className="my-3 border-slate-700" />;
            }

            const Icon = item.icon;
            const isActive = location === item.href;

            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 768) {
                      close();
                    }
                  }}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  <span>{item.name}</span>
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4">
          <div className="text-xs text-slate-400">
            Sistema de Gestão v1.0
          </div>
        </div>
      </div>
    </>
  );
}