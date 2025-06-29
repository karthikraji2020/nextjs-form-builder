import Link from "next/link";

import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="flex items-center justify-between bg-white text-black p-4 border-b border-black/5 h-16">
      <h1 className="flex font-semibold">Form Preview</h1>
      <div className="flex items-center space-x-4">
        <Link href="/builder" className="hover:underline">
          <Button variant="outline" size="sm">
            Publish
          </Button>
        </Link>
      </div>
    </header>
  );
};

export { Header };
