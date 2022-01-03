interface CreatePostProps {
  blog: any;
}

function CreatePost({ blog }: CreatePostProps) {
  return <div>{JSON.stringify(blog)}</div>;
}

export default CreatePost;
