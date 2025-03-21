"use client";

import { useSession } from "next-auth/react";
import { ShoppingItem as ShoppingItemType } from "@/hooks/useShopping";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Edit, ShoppingCart, Trash2, UserPlus } from "lucide-react";

interface ShoppingItemProps {
  item: ShoppingItemType;
  onEdit: (item: ShoppingItemType) => void;
  onDelete: (itemId: string) => void;
  onPurchase: (itemId: string) => void;
  isDeleting: boolean;
  isPurchasing: boolean;
}

export default function ShoppingItem({
  item,
  onEdit,
  onDelete,
  onPurchase,
  isDeleting,
  isPurchasing
}: ShoppingItemProps) {
  const { data: session } = useSession();
  const isOwner = session?.user.id === item.userId;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{item.name}</CardTitle>
            {item.category && (
              <CardDescription>{item.category}</CardDescription>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {item.shared && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                <UserPlus className="h-3 w-3 mr-1" />
                Partagé
              </span>
            )}
            {item.needVerification && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                À vérifier
              </span>
            )}
            {item.purchased && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                <Check className="h-3 w-3 mr-1" />
                Acheté
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          <div className="flex justify-between">
            <span>Quantité:</span>
            <span>
              {item.quantity} {item.unit}
            </span>
          </div>
          {item.price && (
            <div className="flex justify-between">
              <span>Prix:</span>
              <span>{item.price} €</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-2">
        {!item.purchased && (
          <>
            {isOwner && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(item)}
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Modifier</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Supprimer</span>
                </Button>
              </>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
} 