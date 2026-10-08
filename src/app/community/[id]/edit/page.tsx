import {notFound,redirect} from 'next/navigation'
import {getSession} from '@/lib/session'
import {getFeed,getActivitySetting} from '@/data/community'
import {isPlatformId} from '@/lib/platforms'
import {Navigation} from '@/components/Navigation'
import {TopicEditor} from '@/components/social/TopicEditor'
export default async function EditTopicPage({params}:PageProps<'/community/[id]/edit'>){
 if(!await getSession())redirect('/login')
 const {id}=await params;if(!isPlatformId(id))notFound()
 const topic=(await getFeed('all',1,id)).items[0];if(!topic||topic.type==='activity'||!topic.is_owner)notFound()
 const setting=await getActivitySetting()
 return <><Navigation/><main id="main-content" className="mx-auto w-full max-w-[800px] px-4 pb-32 pt-24"><TopicEditor topic={topic} visibility={setting?.profile_visibility}/></main></>
}
