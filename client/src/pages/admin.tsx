import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import AdminPanelFull from "@/plugins/admin/AdminMenu";
import { Button } from "@/components/ui/button";

export default function Admin() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white">
      <header className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/80 to-pink-900/80 backdrop-blur-sm border-b border-pink-500/30">
        <h1 className="text-2xl font-bold gradient-text">ClassikLust Admin Panel</h1>
        <Link href="/">
          <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
            Back to Game
          </Button>
        </Link>
      </header>

      <AdminPanelFull isOpen={true} onClose={() => {}} />
    </div>
  );
}
