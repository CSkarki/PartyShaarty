import { listUserStoryPhotos } from "../../../lib/user-story-store";
import UserStoryMarquee from "./UserStoryMarquee";

export default async function UserStorySection() {
  const photos = await listUserStoryPhotos().catch(() => []);
  if (!photos.length) return null;
  return <UserStoryMarquee photos={photos} />;
}
