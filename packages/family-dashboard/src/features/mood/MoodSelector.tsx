import { Button } from "@/components/ui/button";
import { Smile, Meh, Frown } from "lucide-react";

export const MoodSelector = () => {
    return (
        <div className="flex gap-4 justify-center w-full">
            <Button variant="outline" size="xl" className="flex-1 flex-col gap-2 h-auto py-8 hover:bg-green-100 hover:border-green-500">
                <Smile size={64} className="text-green-500" />
                <span className="text-xl">Happy</span>
            </Button>
            <Button variant="outline" size="xl" className="flex-1 flex-col gap-2 h-auto py-8 hover:bg-yellow-100 hover:border-yellow-500">
                <Meh size={64} className="text-yellow-500" />
                <span className="text-xl">Okay</span>
            </Button>
            <Button variant="outline" size="xl" className="flex-1 flex-col gap-2 h-auto py-8 hover:bg-red-100 hover:border-red-500">
                <Frown size={64} className="text-red-500" />
                <span className="text-xl">Sad</span>
            </Button>
        </div>
    )
}
