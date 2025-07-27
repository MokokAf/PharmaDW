'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export function BackHomeButton() {
  return (
    <Link
      href="/"
      className={buttonVariants({ variant: 'outline', className: 'inline-flex items-center gap-2' })}
    >
      <ArrowLeft className="h-4 w-4" />
      Retour à l'accueil
    </Link>
  );
}
