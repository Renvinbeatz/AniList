import {getSession} from '@/lib/session'
import {redirect,notFound} from 'next/navigation'
import {supabaseServerClient} from '@/data/supabase'
import {isPlatformAnimeId} from '@/lib/platforms'
import {TopicEditor} from '@/components/social/TopicEditor'
import {Navigation} from '@/components/Navigation'
import {getActivitySetting} from '@/data/community'
export default async function ReviewPage({params}:PageProps<'/anime/[anilistId]/review'>) {
 const session=await getSession();if(!session)redirect('/login')
 const id=Number((await params).anilistId);if(!isPlatformAnimeId(id))notFound()
 const {data:anime,error}=await supabaseServerClient.from('anime').select('id,title_romaji,title_english,title_native').eq('anilist_id',id).maybeSingle()
 if(error)throw new Error('Não foi possível carregar o anime.');if(!anime)notFound()
 const {data:existing,error:reviewError}=await supabaseServerClient.from('community_posts').select('id').eq('profile_id',session.profileId).eq('anime_id',anime.id).eq('kind','review').maybeSingle()
 if(reviewError)throw new Error('Não foi possível carregar sua review.')
 if(existing)redirect(`/community/${existing.id}/edit`)
 const setting=await getActivitySetting()
 return <><Navigation/><main id="main-content" className="mx-auto w-full max-w-[800px] px-4 pb-32 pt-24"><TopicEditor anime={{id:anime.id,title:anime.title_romaji||anime.title_english||anime.title_native||'Anime'}} visibility={setting?.profile_visibility}/></main></>
}
