package id.my.efkode.manuknest;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "BookmarkExport")
public class BookmarkExportPlugin extends Plugin {
    @PluginMethod
    public void saveFile(PluginCall call) {
        String fileName = call.getString("fileName");
        String content = call.getString("content");
        if (fileName == null || content == null) {
            call.reject("A file name and content are required.");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, fileName);
        startActivityForResult(call, intent, "handleSaveResult");
    }

    @ActivityCallback
    private void handleSaveResult(PluginCall call, ActivityResult result) {
        if (result.getResultCode() != Activity.RESULT_OK) {
            JSObject response = new JSObject();
            response.put("saved", false);
            call.resolve(response);
            return;
        }

        Uri uri = result.getData() == null ? null : result.getData().getData();
        String content = call.getString("content");
        if (uri == null || content == null) {
            call.reject("Could not create the bookmark file.");
            return;
        }

        try (OutputStream output = getContext().getContentResolver().openOutputStream(uri, "wt")) {
            if (output == null) {
                call.reject("Could not open the bookmark file.");
                return;
            }
            output.write(content.getBytes(StandardCharsets.UTF_8));
            JSObject response = new JSObject();
            response.put("saved", true);
            call.resolve(response);
        } catch (Exception error) {
            call.reject("Could not save the bookmark file.", error);
        }
    }
}
