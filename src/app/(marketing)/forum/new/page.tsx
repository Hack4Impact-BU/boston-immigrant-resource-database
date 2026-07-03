import RightRail from "@/components/forum/RightRail";
import CreatePostForm from "@/components/forum/CreatePostForm";

export default function CreatePostPage() {
  return (
    <div className="mx-auto mt-8 flex w-7xl gap-6 px-4">
      <div className="min-w-0 flex-1">
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
