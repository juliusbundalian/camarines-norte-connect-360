import {render,screen,fireEvent} from '@testing-library/react-native';
import {AvatarSelectionModal} from '../AvatarSelectionModal';
it('shows all nine avatars and commits only on Done',async()=>{
 const done=jest.fn();await render(<AvatarSelectionModal visible value="avatar-1" onDone={done} onCancel={jest.fn()}/>);
 expect(screen.getAllByRole('radio')).toHaveLength(9);
 await fireEvent.press(screen.getByRole('radio',{name:'Avatar 6'}));expect(done).not.toHaveBeenCalled();
 expect(screen.getByRole('radio',{name:'Avatar 6'}).props.accessibilityState.checked).toBe(true);
 await fireEvent.press(screen.getByText('Done'));expect(done).toHaveBeenCalledWith('avatar-6');
});
it('resets canceled modal drafts when reopened',async()=>{
 const cancel=jest.fn(),done=jest.fn();const ui=await render(<AvatarSelectionModal visible value="avatar-1" onDone={done} onCancel={cancel}/>);
 await fireEvent.press(screen.getByRole('radio',{name:'Avatar 6'}));
 await fireEvent(screen.getByTestId('avatar-selection-modal'),'requestClose');expect(cancel).toHaveBeenCalledTimes(1);expect(done).not.toHaveBeenCalled();
 await ui.rerender(<AvatarSelectionModal visible={false} value="avatar-1" onDone={done} onCancel={cancel}/>);
 await ui.rerender(<AvatarSelectionModal visible value="avatar-1" onDone={done} onCancel={cancel}/>);
 expect(screen.getByRole('radio',{name:'Avatar 1'}).props.accessibilityState.checked).toBe(true);
});
