"use client"
import React, { useEffect, useRef, useState } from 'react'
import Header from '@/components/Header'
import { Editor } from '@/components/editor/Editor'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { ClientSideSuspense, RoomProvider } from '@liveblocks/react/suspense'
import ActiveCollaborators from './ActiveCollaborators'
import { Input } from './ui/input'
import Image from 'next/image'
import { updateDocument } from '@/lib/actions/room.actions'
import Loader from './Loader'
import ShareModal from './ShareModal'
function CollaborativeRoom({ roomId, roomMetadata, users, currentUserType }: CollaborativeRoomProps) {

    const [documentTitle, setDocumentTitle] = useState(roomMetadata.title);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    async function updateTitleHandler(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            setLoading(true);
            
            try {
                if (documentTitle !== roomMetadata.title) {
                    const updatedDocument = await updateDocument(roomId, documentTitle)
                    
                    if (updatedDocument) {
                        setEditing(false)
                    }
                }

            } catch (err) {
                console.log("Something went wrong" + err)
            }
            setLoading(false);
        }
    }
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setEditing(false);
                updateDocument(roomId, documentTitle);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [documentTitle, roomId])


    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editing])
 
    // console.log(currentUserType)

    return (
        <RoomProvider id={roomId}>
            <ClientSideSuspense fallback={<Loader></Loader>}>
                <div className='collaborative-room'>
                    <Header>
                        <div ref={containerRef} className='flex w-fit items-center justify-center gap-2'>
                            {editing && !loading ? (
                                <Input
                                    type='text'
                                    value={documentTitle}
                                    ref={inputRef}
                                    placeholder='Title'
                                    onChange={(e) => setDocumentTitle(e.target.value)}
                                    onKeyDown={updateTitleHandler}
                                    disabled={!editing}
                                    className='document-title-input'
                                ></Input>
                            ) : (<>
                                <p className='document-title'>
                                    {documentTitle}
                                </p>
                            </>
                            )}

                            {currentUserType === 'editor' && !editing && (
                                <Image src='/assets/icons/edit.svg'
                                    alt='edit Button'
                                    width={23}
                                    height={23}
                                    onClick={() => { setEditing(true) }}
                                    className='cursor-pointer hover:w-[30px] hover:h-[30px] transition-all'>
                                </Image>
                            )}

                            {currentUserType !== 'editor' && !editing && (
                                <p className='view-only-tag'>View only</p>
                            )}

                            {loading && (
                                <p className='text-sm relative top-1 text-gray-400'>Saving...</p>
                            )}

                        </div>
                        <div className='flex w-full flex-1 justify-end gap-2 sm:gap-3'>
                            <ActiveCollaborators />
                            <ShareModal 
                            roomId={roomId}
                            collaborators={users}
                            creatorId={roomMetadata.creatorId}
                            currentUserType={currentUserType}
                            />
                            <SignedOut>
                                <SignInButton />
                            </SignedOut>
                            <SignedIn>
                                <UserButton />
                            </SignedIn>
                        </div>
                    </Header>
                    <Editor roomId={roomId} currentUserType={currentUserType}></Editor>
                </div>
            </ClientSideSuspense>
        </RoomProvider>
    )
}

export default CollaborativeRoom