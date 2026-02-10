import Image from "next/image";
import DropdownList from "@/components/DropdownList";
//need to add a button to the left of each item which takes me to the sign in page for the specific school
export default function Home() {
  const listData = [
    {title: 'Branham High School', content: '95118 CA'},
    {title: 'Leigh High School', content: 'CA'},
    {title: 'Westmont High School', content: 'CA'},
    {title: 'Item four', content: 'Content for item four'},
    {title: 'Item five', content: 'Content for item five'},
    {title: 'Item six', content: 'Content for item six'},
    {title: 'Item seven', content: 'Content for item seven'},
    {title: 'Item eight', content: 'Content for item eight'},
    {title: 'Item nine', content: 'Content for item nine'},
    {title: 'Item ten', content: 'Content for item ten'},
  ]
  return (
    <div className="min-h-screen bg-white">
      <main>
        <h1 className="text-9xl font-bold text-center">Find Your School</h1>
      <div className="bg-white text-white ml-30 mr-30">
        <h1 className="text-4xl font-bold">Next.js Dropdown List Component</h1>
        <div className="">
          <DropdownList listData={listData} />
        </div>
      </div>
      </main>
    </div>
  );
}