import {getSession} from '@/lib/session'
import {redirect} from 'next/navigation'
import {Navigation} from '@/components/Navigation'
import {TopicEditor} from '@/components/social/TopicEditor'
import {getActivitySetting} from '@/data/community'
export default async function NewTopicPage(){if(!await getSession())redirect('/login');const setting=await getActivitySetting();return <><Navigation/><main id="main-content" className="mx-auto w-full max-w-[800px] px-4 pb-32 pt-24"><TopicEditor visibility={setting?.profile_visibility}/></main></>}
