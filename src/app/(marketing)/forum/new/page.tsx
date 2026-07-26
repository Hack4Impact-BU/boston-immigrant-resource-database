import RightRail from "@/components/forum/RightRail";
import CreatePostForm from "@/components/forum/CreatePostForm";
import Sidebar from "@/components/marketing/Sidebar";


export default function CreatePostPage() {
  return (
    <div className="mx-auto mt-8 flex w-7xl gap-6 px-4">
      <aside className="w-[260px] fixed inset-y-0 left-0 z-50">
          <Sidebar isOpen activePage="FAQs" />
      </aside>
      <div className="min-w-0 flex-1 ml-[260px]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2F80C2]">Create Post</h2>
          {/* <span className="text-sm font-medium text-[#2F80C2]">Drafts</span> */}
        </div>
        <CreatePostForm />
      </div>

      <RightRail />
    </div>
  );
}
