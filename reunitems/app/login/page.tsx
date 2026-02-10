import Image from "next/image";
import DropdownList from "@/components/DropdownList";
//need to add a button to the left of each item which takes me to the sign in page for the specific school
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main>
        <h1 className="text-9xl font-bold text-center">Number: 408-540-4333</h1>
        <h1 className="text-9xl font-bold text-center">Email: reunitems@gmail.com</h1>        
      </main>
    </div>
  );
}