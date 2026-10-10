package dev.lyvt.phoneoffice;

import android.os.Bundle;
import android.view.MotionEvent;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private boolean barrelPressed = false;
    private void updateStylusButton(MotionEvent event) {
        boolean stylus = false;
        for (int i = 0; i < event.getPointerCount(); i++) {
            int tool = event.getToolType(i);
            if (tool == MotionEvent.TOOL_TYPE_STYLUS || tool == MotionEvent.TOOL_TYPE_ERASER) stylus = true;
        }
        if (!stylus) return; // A palm must not release an active pen button.
        boolean pressed = (event.getButtonState() & (MotionEvent.BUTTON_STYLUS_PRIMARY | MotionEvent.BUTTON_STYLUS_SECONDARY)) != 0;
        if (event.getActionMasked() == MotionEvent.ACTION_CANCEL) pressed = false;
        if (pressed == barrelPressed && event.getActionMasked() != MotionEvent.ACTION_DOWN) return;
        barrelPressed = pressed;
        if (bridge != null) bridge.getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('phone-office-stylus-button',{detail:" + pressed + "}))", null);
    }
    @Override public boolean dispatchTouchEvent(MotionEvent event) {
        updateStylusButton(event);
        return super.dispatchTouchEvent(event);
    }
    @Override public boolean dispatchGenericMotionEvent(MotionEvent event) {
        updateStylusButton(event);
        return super.dispatchGenericMotionEvent(event);
    }
    @Override public void onPause() {
        barrelPressed = false;
        if (bridge != null) bridge.getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('phone-office-stylus-button',{detail:false}))", null);
        super.onPause();
    }
    @Override public void onCreate(Bundle state) {
        registerPlugin(NotesFolderPlugin.class);
        super.onCreate(state);
    }
}
